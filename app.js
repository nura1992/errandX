/* ErrandX Control Centre — interactive browser prototype.
 * Demo records are stored locally in this browser and are not connected to a payment provider.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'errandx-control-centre-v1';
  const SERVICE_OPTIONS = ['Errands', 'Food delivery', 'Company dispatch', 'Restaurant orders', 'Small-chops orders'];
  const BENEFICIARIES = [
    { type: 'individual', label: 'Individual rider', icon: 'bike', defaultScope: 'All approved individual riders' },
    { type: 'company_rider', label: 'Company fleet rider', icon: 'users', defaultScope: 'Approved company fleet riders' },
    { type: 'restaurant', label: 'Restaurant', icon: 'utensils', defaultScope: 'All approved restaurants' },
    { type: 'small_chops', label: 'Small-chops vendor', icon: 'store', defaultScope: 'All approved small-chops vendors' }
  ];
  const MODE_LABELS = {
    percentage: 'Percentage share',
    fixed: 'Custom amount',
    per_request: 'Set per request'
  };
  const MODE_SHORT = {
    percentage: 'Percentage',
    fixed: 'Custom amount',
    per_request: 'Per request'
  };
  const BASIS_LABELS = {
    delivery_fee: 'Delivery / service fee',
    merchant_subtotal: 'Vendor item subtotal',
    rider_allocation: 'Company rider allocation',
    custom_base: 'Admin-set eligible amount'
  };
  const BASIS_HELP = {
    delivery_fee: 'The delivery or service fee after discounts. Excludes item costs, tax and tips.',
    merchant_subtotal: 'The vendor item subtotal after discounts. Excludes delivery fee, tax and tips.',
    rider_allocation: 'The rider pool allocated by the fleet/company for this completed job.',
    custom_base: 'A transaction amount supplied by an authorized operator for each order.'
  };
  const TYPE_COLORS = {
    individual: 'rider',
    company_rider: 'company',
    restaurant: 'restaurant',
    small_chops: 'chops'
  };
  const TYPE_ICONS = {
    individual: 'bike',
    company_rider: 'users',
    restaurant: 'utensils',
    small_chops: 'store'
  };
  const DEFAULT_RULES = [
    { id: 'rule-individual-rider', type: 'individual', beneficiary: 'Individual rider', scope: 'All approved individual riders', services: ['Errands', 'Food delivery'], basis: 'delivery_fee', model: 'percentage', rate: 78, amount: 0, active: true, updated: 'Oct 19, 2026' },
    { id: 'rule-company-rider', type: 'company_rider', beneficiary: 'Company fleet rider', scope: 'Approved company fleet riders', services: ['Company dispatch'], basis: 'rider_allocation', model: 'percentage', rate: 72, amount: 0, active: true, updated: 'Oct 18, 2026' },
    { id: 'rule-restaurant', type: 'restaurant', beneficiary: 'Restaurant', scope: 'All approved restaurants', services: ['Restaurant orders'], basis: 'merchant_subtotal', model: 'percentage', rate: 88, amount: 0, active: true, updated: 'Oct 17, 2026' },
    { id: 'rule-small-chops', type: 'small_chops', beneficiary: 'Small-chops vendor', scope: 'All approved small-chops vendors', services: ['Small-chops orders'], basis: 'merchant_subtotal', model: 'fixed', rate: 0, amount: 1500, active: true, updated: 'Oct 16, 2026' }
  ];
  const ORDER_STEPS = {
    errand: ['REQUESTED', 'PROVIDER_ACCEPTED', 'PAYMENT_VERIFIED', 'PICKUP_VERIFIED', 'ON_TRANSIT', 'DELIVERY_VERIFIED', 'COMPLETED'],
    vendor: ['REQUESTED', 'VENDOR_ACCEPTED', 'PAYMENT_VERIFIED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKUP_VERIFIED', 'ON_TRANSIT', 'DELIVERY_VERIFIED', 'COMPLETED']
  };
  const ORDER_STATE_LABELS = {
    REQUESTED: 'Request submitted',
    PROVIDER_ACCEPTED: 'Provider accepted',
    VENDOR_ACCEPTED: 'Vendor accepted',
    PAYMENT_VERIFIED: 'Payment verified',
    PREPARING: 'Preparing order',
    READY_FOR_PICKUP: 'Ready for pickup',
    PICKUP_VERIFIED: 'Pickup verified',
    ON_TRANSIT: 'On transit',
    DELIVERY_VERIFIED: 'Recipient code verified',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  };
  const ORDER_NEXT_ACTIONS = {
    PROVIDER_ACCEPTED: 'Simulate provider acceptance',
    VENDOR_ACCEPTED: 'Simulate vendor acceptance',
    PAYMENT_VERIFIED: 'Simulate payment confirmation',
    PREPARING: 'Start vendor preparation',
    READY_FOR_PICKUP: 'Mark ready for pickup',
    PICKUP_VERIFIED: 'Simulate pickup verification',
    ON_TRANSIT: 'Start delivery transit',
    DELIVERY_VERIFIED: 'Simulate recipient code verification',
    COMPLETED: 'Complete order & queue settlement'
  };
  const DEFAULT_ORDERS = [
    { id: 'EX-20481', workflow: 'vendor', state: 'ON_TRANSIT', service: 'Restaurant order', customer: 'Aisha Bello', provider: 'Arewa Kitchen', rider: 'Sadiq Umar', area: 'Nassarawa, Kano', total: 8450, created: '10:14 AM', history: [
      { state: 'REQUESTED', actor: 'Customer', at: '10:14 AM' }, { state: 'VENDOR_ACCEPTED', actor: 'Arewa Kitchen', at: '10:16 AM' }, { state: 'PAYMENT_VERIFIED', actor: 'Payment service (demo)', at: '10:18 AM' }, { state: 'PREPARING', actor: 'Arewa Kitchen', at: '10:20 AM' }, { state: 'READY_FOR_PICKUP', actor: 'Arewa Kitchen', at: '10:38 AM' }, { state: 'PICKUP_VERIFIED', actor: 'Rider (demo)', at: '10:43 AM' }, { state: 'ON_TRANSIT', actor: 'Rider (demo)', at: '10:44 AM' }
    ] },
    { id: 'EX-20479', workflow: 'errand', state: 'REQUESTED', service: 'Document errand', customer: 'Musa Sani', provider: 'Awaiting eligible rider', rider: 'Unassigned', area: 'Fagge, Kano', total: 3200, created: '10:52 AM', history: [{ state: 'REQUESTED', actor: 'Customer', at: '10:52 AM' }] },
    { id: 'EX-20468', workflow: 'vendor', state: 'REQUESTED', service: 'Restaurant order', customer: 'Maryam Ibrahim', provider: 'Awaiting eligible vendor', rider: 'Pending vendor acceptance', area: 'Nassarawa, Kano', total: 4600, created: '11:02 AM', history: [{ state: 'REQUESTED', actor: 'Customer (sample)', at: '11:02 AM' }] },
    { id: 'EX-20465', workflow: 'vendor', state: 'REQUESTED', service: 'Small-chops order', customer: 'Rukayya Sani', provider: 'Awaiting eligible vendor', rider: 'Pending vendor acceptance', area: 'Gwale, Kano', total: 5200, created: '11:05 AM', history: [{ state: 'REQUESTED', actor: 'Customer (sample)', at: '11:05 AM' }] },
    { id: 'EX-20475', workflow: 'vendor', state: 'PREPARING', service: 'Small-chops order', customer: 'Zainab Yusuf', provider: 'Zee Small Chops', rider: 'Pending fleet assignment', area: 'Tarauni, Kano', total: 12800, created: '10:32 AM', history: [
      { state: 'REQUESTED', actor: 'Customer', at: '10:32 AM' }, { state: 'VENDOR_ACCEPTED', actor: 'Zee Small Chops', at: '10:35 AM' }, { state: 'PAYMENT_VERIFIED', actor: 'Payment service (demo)', at: '10:37 AM' }, { state: 'PREPARING', actor: 'Zee Small Chops', at: '10:39 AM' }
    ] },
    { id: 'EX-20472', workflow: 'errand', state: 'PICKUP_VERIFIED', service: 'Market pickup', customer: 'Ibrahim Ali', provider: 'Individual rider', rider: 'Amina Garba', area: 'Fagge, Kano', total: 5600, created: '10:01 AM', history: [
      { state: 'REQUESTED', actor: 'Customer', at: '10:01 AM' }, { state: 'PROVIDER_ACCEPTED', actor: 'Amina Garba', at: '10:04 AM' }, { state: 'PAYMENT_VERIFIED', actor: 'Payment service (demo)', at: '10:07 AM' }, { state: 'PICKUP_VERIFIED', actor: 'Rider (demo)', at: '10:12 AM' }
    ] }
  ];
  const FORM_FIELD_TYPES = {
    text: 'Short text',
    textarea: 'Long description',
    number: 'Number',
    phone: 'Phone',
    select: 'Dropdown',
    radio: 'Radio buttons',
    checkbox: 'Checkboxes',
    pickup: 'Pickup address',
    destination: 'Destination address',
    location: 'State / LGA / area',
    date: 'Date',
    time: 'Time',
    file: 'File upload',
    image: 'Image upload',
    instructions: 'Delivery instructions'
  };
  const DEFAULT_FORMS = [
    {
      id: 'form-general-errand', name: 'General errand', service: 'Errands', version: 3, status: 'Published', updated: 'Oct 15, 2026',
      fields: [
        { id: 'field-pickup', key: 'pickup_address', label: 'Pickup address', type: 'pickup', required: true, help: 'Tell your provider where to collect the item.', options: [] },
        { id: 'field-destination', key: 'destination_address', label: 'Destination address', type: 'destination', required: true, help: 'Include the recipient’s area or landmark.', options: [] },
        { id: 'field-description', key: 'errand_details', label: 'What do you need done?', type: 'textarea', required: true, help: 'Add item details or instructions.', options: [] },
        { id: 'field-photo', key: 'reference_photo', label: 'Reference photo', type: 'image', required: false, help: 'Add a photo to help your provider identify the item.', options: [] }
      ],
      published: { version: 3, name: 'General errand', service: 'Errands', fields: [
        { id: 'field-pickup', key: 'pickup_address', label: 'Pickup address', type: 'pickup', required: true, help: 'Tell your provider where to collect the item.', options: [] },
        { id: 'field-destination', key: 'destination_address', label: 'Destination address', type: 'destination', required: true, help: 'Include the recipient’s area or landmark.', options: [] },
        { id: 'field-description', key: 'errand_details', label: 'What do you need done?', type: 'textarea', required: true, help: 'Add item details or instructions.', options: [] },
        { id: 'field-photo', key: 'reference_photo', label: 'Reference photo', type: 'image', required: false, help: 'Add a photo to help your provider identify the item.', options: [] }
      ] },
      history: [{ version: 2, date: 'Oct 10, 2026', fieldCount: 3 }]
    },
    {
      id: 'form-food-pickup', name: 'Food pickup', service: 'Food delivery', version: 2, status: 'Published', updated: 'Oct 12, 2026',
      fields: [
        { id: 'field-restaurant', key: 'restaurant', label: 'Restaurant', type: 'select', required: true, help: 'Choose an available restaurant.', options: ['Arewa Kitchen', 'Savour House', 'Other'] },
        { id: 'field-items', key: 'food_items', label: 'Food items', type: 'textarea', required: true, help: 'List items and quantities.', options: [] },
        { id: 'field-allergy', key: 'allergy_notes', label: 'Dietary or allergy notes?', type: 'radio', required: true, help: 'Let the restaurant know about food needs.', options: ['Yes', 'No'] },
        { id: 'field-allergy-detail', key: 'allergy_detail', label: 'Add dietary details', type: 'text', required: false, help: '', options: [], dependsOn: 'allergy_notes', conditionValue: 'Yes' }
      ],
      published: { version: 2, name: 'Food pickup', service: 'Food delivery', fields: [
        { id: 'field-restaurant', key: 'restaurant', label: 'Restaurant', type: 'select', required: true, help: 'Choose an available restaurant.', options: ['Arewa Kitchen', 'Savour House', 'Other'] },
        { id: 'field-items', key: 'food_items', label: 'Food items', type: 'textarea', required: true, help: 'List items and quantities.', options: [] },
        { id: 'field-allergy', key: 'allergy_notes', label: 'Dietary or allergy notes?', type: 'radio', required: true, help: 'Let the restaurant know about food needs.', options: ['Yes', 'No'] },
        { id: 'field-allergy-detail', key: 'allergy_detail', label: 'Add dietary details', type: 'text', required: false, help: '', options: [], dependsOn: 'allergy_notes', conditionValue: 'Yes' }
      ] },
      history: [{ version: 1, date: 'Oct 02, 2026', fieldCount: 3 }]
    },
    {
      id: 'form-document', name: 'Document delivery', service: 'Errands', version: 1, status: 'Draft', updated: 'Oct 18, 2026',
      fields: [
        { id: 'field-doc-type', key: 'document_type', label: 'Document type', type: 'select', required: true, help: 'Choose the item to be delivered.', options: ['Envelope', 'Application form', 'Other'] },
        { id: 'field-doc-pickup', key: 'pickup_address', label: 'Pickup address', type: 'pickup', required: true, help: '', options: [] },
        { id: 'field-doc-destination', key: 'destination_address', label: 'Recipient address', type: 'destination', required: true, help: '', options: [] },
        { id: 'field-recipient-phone', key: 'recipient_phone', label: 'Recipient phone number', type: 'phone', required: true, help: 'Used for delivery coordination.', options: [] }
      ],
      published: null,
      history: []
    }
  ];
  const DEFAULT_FEATURES = {
    errands: true,
    food: true,
    smallChops: true,
    individualRiders: true,
    companyFleet: true,
    qrPickup: true,
    withdrawals: true,
    companySalary: false,
    reviews: true,
    promotions: false,
    threeD: true,
    videoKyc: true
  };
  const DEFAULT_PERMISSIONS = {
    'orders.view': [true, true, true, true],
    'orders.edit': [true, false, false, true],
    'orders.assign': [true, false, false, true],
    'riders.view': [true, true, false, true],
    'applications.view': [true, true, false, false],
    'applications.approve': [false, true, false, false],
    'applications.view_sensitive_data': [false, true, false, false],
    'finance.view_financial_data': [false, false, true, false],
    'withdrawals.approve': [false, false, true, false],
    'roles.manage': [false, false, false, false]
  };

  const APPLICATION_STATUS_LABELS = {
    SUBMITTED: 'Submitted',
    IN_REVIEW: 'In review',
    INFO_REQUESTED: 'More info requested',
    APPROVED: 'Approved',
    REJECTED: 'Rejected'
  };
  const APPLICATION_CHECKLISTS = {
    rider: [
      'Profile details complete',
      'Identity provider result reviewed',
      'Address evidence meets configured policy',
      'Guarantor consent recorded',
      'Liveness provider session reviewed'
    ],
    company: [
      'Company registration check complete',
      'Business address evidence reviewed',
      'Principal officer verification complete',
      'Service areas and fleet details reviewed'
    ],
    vendor: [
      'Business contact details reviewed',
      'Service area and opening hours checked',
      'Menu or product catalogue reviewed',
      'Partner terms accepted'
    ]
  };
  const DEFAULT_APPLICATIONS = [
    {
      id: 'APP-RD-0149', kind: 'rider', category: 'Individual rider', name: 'Halima Ibrahim', location: 'Kano Municipal', submitted: 'Today, 09:42', status: 'SUBMITTED', reviewer: '',
      evidence: [{ label: 'Identity provider result', status: 'Received' }, { label: 'Address evidence', status: 'Received' }, { label: 'Guarantor consent record', status: 'Received' }, { label: 'Liveness session result', status: 'Received' }],
      checks: [false, false, false, false, false], lastNote: '', history: [{ title: 'Application submitted', actor: 'Applicant', at: '09:42 AM', note: '' }]
    },
    {
      id: 'APP-CO-0038', kind: 'company', category: 'Company fleet', name: 'Kano Rapid', location: 'Kano Municipal', submitted: 'Today, 08:15', status: 'IN_REVIEW', reviewer: 'KYC Reviewer',
      evidence: [{ label: 'Company registration check', status: 'Received' }, { label: 'Business address evidence', status: 'Received' }, { label: 'Principal officer session result', status: 'Received' }, { label: 'Fleet and service area details', status: 'Received' }],
      checks: [true, true, false, false], lastNote: '', history: [{ title: 'Application submitted', actor: 'Applicant', at: '08:15 AM', note: '' }, { title: 'Assigned for review', actor: 'Operations Manager', at: '08:32 AM', note: 'Assigned to KYC Reviewer' }]
    },
    {
      id: 'APP-VN-0084', kind: 'vendor', category: 'Restaurant', name: 'Savour House', location: 'Tarauni, Kano', submitted: 'Yesterday, 16:20', status: 'INFO_REQUESTED', reviewer: 'Operations Manager',
      evidence: [{ label: 'Business contact review', status: 'Received' }, { label: 'Service area details', status: 'Received' }, { label: 'Menu and opening hours', status: 'Needs update' }, { label: 'Partner terms', status: 'Received' }],
      checks: [true, true, false, false], lastNote: 'Please add current menu prices and opening hours.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Yesterday, 04:20 PM', note: '' }, { title: 'More information requested', actor: 'Operations Manager', at: 'Yesterday, 05:03 PM', note: 'Please add current menu prices and opening hours.' }]
    },
    {
      id: 'APP-SC-0031', kind: 'vendor', category: 'Small-chops vendor', name: 'Binta Bites', location: 'Gwale, Kano', submitted: 'Oct 17, 2026', status: 'APPROVED', reviewer: 'KYC Reviewer',
      evidence: [{ label: 'Business contact review', status: 'Received' }, { label: 'Service area details', status: 'Received' }, { label: 'Menu and opening hours', status: 'Received' }, { label: 'Partner terms', status: 'Received' }],
      checks: [true, true, true, true], lastNote: 'Approved for the current service area.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 17, 2026', note: '' }, { title: 'Application approved', actor: 'KYC Reviewer', at: 'Oct 18, 2026', note: 'Approved for the current service area.' }]
    },
    {
      id: 'APP-RD-0182', kind: 'rider', category: 'Individual rider', name: 'Sani Umar', location: 'Fagge, Kano', submitted: 'Oct 16, 2026', status: 'REJECTED', reviewer: 'KYC Reviewer',
      evidence: [{ label: 'Identity provider result', status: 'Received' }, { label: 'Address evidence', status: 'Needs update' }, { label: 'Guarantor consent record', status: 'Received' }, { label: 'Liveness session result', status: 'Received' }],
      checks: [true, true, false, true, true], lastNote: 'Address evidence could not be verified. The applicant may reapply with updated documentation.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 16, 2026', note: '' }, { title: 'Application rejected', actor: 'KYC Reviewer', at: 'Oct 17, 2026', note: 'Address evidence could not be verified. The applicant may reapply with updated documentation.' }]
    },
    {
      id: 'APP-RD-0092', kind: 'rider', category: 'Company fleet rider', name: 'Sadiq Umar', location: 'Kano Municipal', submitted: 'Oct 14, 2026', status: 'APPROVED', reviewer: 'KYC Reviewer',
      evidence: [{ label: 'Identity provider result', status: 'Received' }, { label: 'Address evidence', status: 'Received' }, { label: 'Guarantor consent record', status: 'Received' }, { label: 'Liveness session result', status: 'Received' }],
      checks: [true, true, true, true, true], lastNote: 'Individual rider review complete.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 14, 2026', note: '' }, { title: 'Application approved', actor: 'KYC Reviewer', at: 'Oct 15, 2026', note: 'Individual rider review complete.' }]
    },
    {
      id: 'APP-CO-0042', kind: 'company', category: 'Company fleet', name: 'Kano Express', location: 'Kano Municipal', submitted: 'Oct 13, 2026', status: 'APPROVED', reviewer: 'Operations Manager',
      evidence: [{ label: 'Company registration check', status: 'Received' }, { label: 'Business address evidence', status: 'Received' }, { label: 'Principal officer session result', status: 'Received' }, { label: 'Fleet and service area details', status: 'Received' }],
      checks: [true, true, true, true], lastNote: 'Company fleet review complete.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 13, 2026', note: '' }, { title: 'Application approved', actor: 'Operations Manager', at: 'Oct 14, 2026', note: 'Company fleet review complete.' }]
    },
    {
      id: 'APP-RD-0227', kind: 'rider', category: 'Individual rider', name: 'Amina Garba', location: 'Fagge, Kano', submitted: 'Oct 12, 2026', status: 'APPROVED', reviewer: 'KYC Reviewer',
      evidence: [{ label: 'Identity provider result', status: 'Received' }, { label: 'Address evidence', status: 'Received' }, { label: 'Guarantor consent record', status: 'Received' }, { label: 'Liveness session result', status: 'Received' }],
      checks: [true, true, true, true, true], lastNote: 'Individual rider review complete.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 12, 2026', note: '' }, { title: 'Application approved', actor: 'KYC Reviewer', at: 'Oct 13, 2026', note: 'Individual rider review complete.' }]
    },
    {
      id: 'APP-RD-0711', kind: 'rider', category: 'Company fleet rider', name: 'Bashir Lawal', location: 'Kano Municipal', submitted: 'Oct 12, 2026', status: 'APPROVED', reviewer: 'KYC Reviewer',
      evidence: [{ label: 'Identity provider result', status: 'Received' }, { label: 'Address evidence', status: 'Received' }, { label: 'Guarantor consent record', status: 'Received' }, { label: 'Liveness session result', status: 'Received' }],
      checks: [true, true, true, true, true], lastNote: 'Individual rider review complete. Company approval is separate.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 12, 2026', note: '' }, { title: 'Application approved', actor: 'KYC Reviewer', at: 'Oct 13, 2026', note: 'Individual rider review complete. Company approval is separate.' }]
    },
    {
      id: 'APP-RD-0408', kind: 'rider', category: 'Individual rider', name: 'Fatima Bello', location: 'Kano Municipal', submitted: 'Oct 11, 2026', status: 'APPROVED', reviewer: 'KYC Reviewer',
      evidence: [{ label: 'Identity provider result', status: 'Received' }, { label: 'Address evidence', status: 'Received' }, { label: 'Guarantor consent record', status: 'Received' }, { label: 'Liveness session result', status: 'Received' }],
      checks: [true, true, true, true, true], lastNote: 'Individual rider review complete.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 11, 2026', note: '' }, { title: 'Application approved', actor: 'KYC Reviewer', at: 'Oct 12, 2026', note: 'Individual rider review complete.' }]
    },
    {
      id: 'APP-VN-0042', kind: 'vendor', category: 'Restaurant', name: 'Arewa Kitchen', location: 'Nassarawa, Kano', submitted: 'Oct 10, 2026', status: 'APPROVED', reviewer: 'Operations Manager',
      evidence: [{ label: 'Business contact review', status: 'Received' }, { label: 'Service area details', status: 'Received' }, { label: 'Menu and opening hours', status: 'Received' }, { label: 'Partner terms', status: 'Received' }],
      checks: [true, true, true, true], lastNote: 'Restaurant partner review complete.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 10, 2026', note: '' }, { title: 'Application approved', actor: 'Operations Manager', at: 'Oct 11, 2026', note: 'Restaurant partner review complete.' }]
    },
    {
      id: 'APP-VN-0102', kind: 'vendor', category: 'Restaurant', name: 'Kano Dine-In', location: 'Kano Municipal', submitted: 'Oct 09, 2026', status: 'APPROVED', reviewer: 'Operations Manager',
      evidence: [{ label: 'Business contact review', status: 'Received' }, { label: 'Service area details', status: 'Received' }, { label: 'Menu and opening hours', status: 'Received' }, { label: 'Partner terms', status: 'Received' }],
      checks: [true, true, true, true], lastNote: 'Restaurant partner review complete.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 09, 2026', note: '' }, { title: 'Application approved', actor: 'Operations Manager', at: 'Oct 10, 2026', note: 'Restaurant partner review complete.' }]
    },
    {
      id: 'APP-SC-0071', kind: 'vendor', category: 'Small-chops vendor', name: 'Zee Small Chops', location: 'Tarauni, Kano', submitted: 'Oct 08, 2026', status: 'APPROVED', reviewer: 'Operations Manager',
      evidence: [{ label: 'Business contact review', status: 'Received' }, { label: 'Service area details', status: 'Received' }, { label: 'Menu and opening hours', status: 'Received' }, { label: 'Partner terms', status: 'Received' }],
      checks: [true, true, true, true], lastNote: 'Small-chops partner review complete.', history: [{ title: 'Application submitted', actor: 'Applicant', at: 'Oct 08, 2026', note: '' }, { title: 'Application approved', actor: 'Operations Manager', at: 'Oct 09, 2026', note: 'Small-chops partner review complete.' }]
    }
  ];

  const NIGERIAN_STATES = [
    'Abia State', 'Adamawa State', 'Akwa Ibom State', 'Anambra State', 'Bauchi State', 'Bayelsa State', 'Benue State', 'Borno State', 'Cross River State', 'Delta State', 'Ebonyi State', 'Edo State', 'Ekiti State', 'Enugu State', 'Federal Capital Territory', 'Gombe State', 'Imo State', 'Jigawa State', 'Kaduna State', 'Kano State', 'Katsina State', 'Kebbi State', 'Kogi State', 'Kwara State', 'Lagos State', 'Nasarawa State', 'Niger State', 'Ogun State', 'Ondo State', 'Osun State', 'Oyo State', 'Plateau State', 'Rivers State', 'Sokoto State', 'Taraba State', 'Yobe State', 'Zamfara State'
  ];
  const DEFAULT_COVERAGE = [{
    name: 'Kano State',
    lgas: [
      { name: 'Kano Municipal', areas: ['Central Market', 'Fagge', 'Kofar Mata', 'Sabon Gari'] },
      { name: 'Nassarawa', areas: ['Bompai', 'Hotoro', 'Giginyu', 'Tudun Wada'] },
      { name: 'Tarauni', areas: ['Gyadi-Gyadi', 'Unguwa Uku', 'Ja’en'] },
      { name: 'Gwale', areas: ['Dorayi', 'Goron Dutse', 'Dandago'] }
    ]
  }];
  const MATCHING_PROVIDERS = [
    { id: 'RD-0149', applicationId: 'APP-RD-0149', name: 'Halima Ibrahim', type: 'individual_rider', label: 'Individual rider', company: '', approved: true, companyApproved: true, online: true, available: true, serviceGroups: ['errand', 'delivery'], coverage: [{ state: 'Kano State', lga: 'Kano Municipal', areas: ['Central Market', 'Fagge', 'Kofar Mata'] }, { state: 'Kano State', lga: 'Nassarawa', areas: [] }, { state: 'Kano State', lga: 'Tarauni', areas: [] }], rating: '4.9', capacity: 3, vehicle: 'Motorcycle' },
    { id: 'RD-0092', applicationId: 'APP-RD-0092', companyApplicationId: 'APP-CO-0042', name: 'Sadiq Umar', type: 'company_rider', label: 'Company fleet rider', company: 'Kano Express', approved: true, companyApproved: true, online: true, available: true, serviceGroups: ['errand', 'delivery'], coverage: [{ state: 'Kano State', lga: 'Kano Municipal', areas: [] }, { state: 'Kano State', lga: 'Nassarawa', areas: [] }, { state: 'Kano State', lga: 'Tarauni', areas: [] }], rating: '4.8', capacity: 4, vehicle: 'Company motorcycle' },
    { id: 'RD-0227', applicationId: 'APP-RD-0227', name: 'Amina Garba', type: 'individual_rider', label: 'Individual rider', company: '', approved: true, companyApproved: true, online: true, available: true, serviceGroups: ['errand', 'delivery'], coverage: [{ state: 'Kano State', lga: 'Kano Municipal', areas: ['Fagge', 'Sabon Gari'] }, { state: 'Kano State', lga: 'Gwale', areas: [] }], rating: '4.7', capacity: 3, vehicle: 'Motorcycle' },
    { id: 'RD-0711', applicationId: 'APP-RD-0711', companyApplicationId: 'APP-CO-0038', name: 'Bashir Lawal', type: 'company_rider', label: 'Company fleet rider', company: 'Kano Rapid', approved: true, companyApproved: false, online: true, available: true, serviceGroups: ['errand', 'delivery'], coverage: [{ state: 'Kano State', lga: 'Kano Municipal', areas: [] }], rating: '4.6', capacity: 3, vehicle: 'Company motorcycle' },
    { id: 'RD-0408', applicationId: 'APP-RD-0408', name: 'Fatima Bello', type: 'individual_rider', label: 'Individual rider', company: '', approved: true, companyApproved: true, online: false, available: true, serviceGroups: ['errand', 'delivery'], coverage: [{ state: 'Kano State', lga: 'Kano Municipal', areas: [] }], rating: '4.8', capacity: 3, vehicle: 'Motorcycle' },
    { id: 'RD-0182', applicationId: 'APP-RD-0182', name: 'Sani Umar', type: 'individual_rider', label: 'Individual rider', company: '', approved: false, companyApproved: true, online: true, available: true, serviceGroups: ['errand', 'delivery'], coverage: [{ state: 'Kano State', lga: 'Kano Municipal', areas: [] }], rating: '—', capacity: 3, vehicle: 'Motorcycle' },
    { id: 'VN-0042', applicationId: 'APP-VN-0042', name: 'Arewa Kitchen', type: 'restaurant', label: 'Restaurant', company: '', approved: true, companyApproved: true, online: true, available: true, serviceGroups: ['restaurant'], coverage: [{ state: 'Kano State', lga: 'Nassarawa', areas: [] }, { state: 'Kano State', lga: 'Kano Municipal', areas: ['Sabon Gari'] }], rating: '4.8', capacity: 8, vehicle: '' },
    { id: 'VN-0102', applicationId: 'APP-VN-0102', name: 'Kano Dine-In', type: 'restaurant', label: 'Restaurant', company: '', approved: true, companyApproved: true, online: true, available: true, serviceGroups: ['restaurant'], coverage: [{ state: 'Kano State', lga: 'Kano Municipal', areas: [] }], rating: '4.6', capacity: 8, vehicle: '' },
    { id: 'VN-0071', applicationId: 'APP-SC-0071', name: 'Zee Small Chops', type: 'small_chops', label: 'Small-chops vendor', company: '', approved: true, companyApproved: true, online: true, available: true, serviceGroups: ['small_chops'], coverage: [{ state: 'Kano State', lga: 'Tarauni', areas: [] }, { state: 'Kano State', lga: 'Kano Municipal', areas: ['Fagge'] }], rating: '4.9', capacity: 6, vehicle: '' },
    { id: 'VN-0031', applicationId: 'APP-SC-0031', name: 'Binta Bites', type: 'small_chops', label: 'Small-chops vendor', company: '', approved: true, companyApproved: true, online: true, available: true, serviceGroups: ['small_chops'], coverage: [{ state: 'Kano State', lga: 'Gwale', areas: [] }], rating: '4.7', capacity: 6, vehicle: '' },
    { id: 'VN-0084', applicationId: 'APP-VN-0084', name: 'Savour House', type: 'restaurant', label: 'Restaurant', company: '', approved: false, companyApproved: true, online: true, available: true, serviceGroups: ['restaurant'], coverage: [{ state: 'Kano State', lga: 'Tarauni', areas: [] }], rating: '—', capacity: 8, vehicle: '' }
  ];

  const PAGE_META = {
    overview: {
      group: 'Workspace', title: 'Platform overview', eyebrow: 'COMMAND CENTRE',
      description: 'A live-style snapshot of ErrandX operations across service areas. Sample figures are for demonstration only.',
      stats: [
        ['Active orders', '284', '11.2% vs. last week', 'activity', 'green'],
        ['Gross order value', '₦3.82m', '8.4% vs. last week', 'chart', 'orange'],
        ['Partners online', '126', 'Across 4 service areas', 'users', 'blue'],
        ['Applications to review', '23', '7 require KYC review', 'file', 'amber']
      ],
      sectionTitle: 'Live operations', sectionCopy: 'Recent activity across errands, food and small-chops orders.',
      heroTitle: 'Your marketplace, at a glance', heroCopy: 'Monitor activity by state, LGA and neighbourhood. Every status change should be validated by the order state machine and recorded in the audit trail.',
      rows: [
        { name: 'EX-20481', initials: 'EX', detail: 'Food order · Aisha Bello', area: 'Nassarawa, Kano', amount: '₦8,450', status: 'On transit', badge: 'blue' },
        { name: 'EX-20479', initials: 'EX', detail: 'Document errand · Musa Sani', area: 'Kano Municipal', amount: '₦3,200', status: 'Awaiting rider', badge: 'amber' },
        { name: 'EX-20475', initials: 'EX', detail: 'Small chops · Zainab Yusuf', area: 'Tarauni, Kano', amount: '₦12,800', status: 'Preparing', badge: 'orange' },
        { name: 'EX-20472', initials: 'EX', detail: 'Market pickup · Ibrahim Ali', area: 'Fagge, Kano', amount: '₦5,600', status: 'Delivered', badge: 'green' }
      ],
      sideTitle: 'Service health', sideCopy: 'Acceptance and fulfilment trends in your selected view.',
      health: [['Errands', 92], ['Food delivery', 96], ['Small chops', 88], ['Company dispatch', 94]]
    },
    'live-orders': {
      group: 'Workspace', title: 'Live orders', eyebrow: 'WORKSPACE / OPERATIONS',
      description: 'Monitor active jobs, verify state transitions and find the right order quickly.',
      stats: [['In progress', '48', 'Across all services', 'activity', 'green'], ['Waiting for provider', '18', 'Acceptance countdown active', 'clock', 'amber'], ['On transit', '26', 'Pickup verified', 'bike', 'blue'], ['At risk', '3', 'Needs operations review', 'shield', 'orange']],
      sectionTitle: 'Active order monitor', sectionCopy: 'Only approved providers and authorized staff can act on these orders.',
      heroTitle: 'Live order operations', heroCopy: 'Requests follow a controlled workflow: provider acceptance, verified checkout, pickup confirmation, transit and recipient delivery verification.',
      rows: [
        { name: 'EX-20481', initials: 'EX', detail: 'Restaurant order · Aisha Bello', area: 'Nassarawa, Kano', amount: '₦8,450', status: 'On transit', badge: 'blue' },
        { name: 'EX-20479', initials: 'EX', detail: 'Document errand · Musa Sani', area: 'Kano Municipal', amount: '₦3,200', status: 'Finding rider', badge: 'amber' },
        { name: 'EX-20475', initials: 'EX', detail: 'Small chops · Zainab Yusuf', area: 'Tarauni, Kano', amount: '₦12,800', status: 'Preparing', badge: 'orange' },
        { name: 'EX-20469', initials: 'EX', detail: 'Parcel delivery · Sadiq Umar', area: 'Gwale, Kano', amount: '₦4,900', status: 'Pickup verified', badge: 'green' }
      ],
      sideTitle: 'Operational guardrails', sideCopy: 'A safe order flow protects customers, partners and the ledger.',
      infoItems: ['Pickup and delivery credentials are tied to one order and expire after use.', 'A provider timeout returns the request to the eligible matching queue.', 'Never complete an order by editing a database status directly.']
    },
    'assignment-queue': {
      group: 'Workspace', title: 'Assignment queue', eyebrow: 'WORKSPACE / MATCHING',
      description: 'Requests awaiting a qualified rider, company fleet or service partner.',
      stats: [['Unassigned', '18', 'Requests looking for a provider', 'clipboard', 'amber'], ['Online eligible', '126', 'Approved in selected area', 'users', 'green'], ['Median wait', '04:32', 'Minutes to acceptance', 'clock', 'blue'], ['Timed out today', '7', 'Re-offer required', 'activity', 'orange']],
      sectionTitle: 'Waiting for assignment', sectionCopy: 'Eligibility is determined by service, pickup area, approval and availability.',
      heroTitle: 'Smart provider matching', heroCopy: 'Match on pickup coverage, verified operating locations, service category, current availability and outstanding assignments before offering a job.',
      rows: [
        { name: 'EX-20492', initials: 'EX', detail: 'Medicine pickup · S. Abdullahi', area: 'Kano Municipal', amount: '₦2,700', status: '02:14 left', badge: 'amber' },
        { name: 'EX-20489', initials: 'EX', detail: 'Food delivery · M. Yusuf', area: 'Nassarawa, Kano', amount: '₦4,200', status: '04:08 left', badge: 'orange' },
        { name: 'EX-20488', initials: 'EX', detail: 'Company dispatch · H. Bello', area: 'Fagge, Kano', amount: '₦6,100', status: 'Company review', badge: 'blue' }
      ],
      sideTitle: 'Countdown rules', sideCopy: 'Acceptance and preparation clocks are separate settings.',
      infoItems: ['Errands: 90-second provider response window.', 'Restaurant acceptance and food preparation have separate timers.', 'Expired offers notify the customer and can be re-matched.']
    },
    errands: {
      group: 'Marketplace', title: 'Errand services', eyebrow: 'MARKETPLACE / SERVICE CATALOGUE',
      description: 'Configure errand categories, requirements and eligibility before a customer creates a request.',
      stats: [['Active categories', '8', 'Across 4 service areas', 'package', 'green'], ['Requests today', '642', 'Errands only', 'activity', 'orange'], ['Avg. delivery fee', '₦2,850', 'Illustrative sample', 'banknote', 'blue'], ['Enabled areas', '12', 'Kano State', 'map', 'amber']],
      sectionTitle: 'Errand categories', sectionCopy: 'Service definitions are versioned so historical orders remain readable.',
      heroTitle: 'Build services around local needs', heroCopy: 'Create configurable categories for shopping, document runs and parcel delivery. Attach eligibility rules, form fields and pricing without changing existing orders.',
      rows: [
        { name: 'Market shopping', initials: 'MS', detail: 'Item list · Photo optional', area: '12 service areas', amount: 'From ₦1,800', status: 'Enabled', badge: 'green' },
        { name: 'Document delivery', initials: 'DD', detail: 'Recipient details · OTP', area: '9 service areas', amount: 'From ₦1,500', status: 'Enabled', badge: 'green' },
        { name: 'Medicine pickup', initials: 'MP', detail: 'Prescription upload required', area: '6 service areas', amount: 'From ₦2,200', status: 'Review required', badge: 'amber' }
      ],
      sideTitle: 'Category controls', sideCopy: 'Use feature availability to pause new requests without removing historical data.',
      infoItems: ['Configure pricing, order fields and acceptance windows per category.', 'Pickup and destination must resolve to configured service areas.', 'Sensitive attachments belong in private storage, not public links.']
    },
    vendors: {
      group: 'Marketplace', title: 'Restaurants & vendors', eyebrow: 'MARKETPLACE / PARTNERS',
      description: 'Manage restaurant and small-chops partner applications, service areas and trading status.',
      stats: [['Approved partners', '84', '56 restaurants · 28 vendors', 'store', 'green'], ['Online now', '61', 'Accepting new orders', 'activity', 'blue'], ['Pending review', '12', '4 need documents', 'file', 'amber'], ['Partner sales today', '₦2.16m', 'Sample marketplace total', 'chart', 'orange']],
      sectionTitle: 'Partner directory', sectionCopy: 'Approval, service areas and payout rules are managed independently.',
      heroTitle: 'One marketplace, many local partners', heroCopy: 'Restaurants and small-chops vendors set menus, hours and stock after approval. Only partners online in the customer’s service area can accept new orders.',
      rows: [
        { name: 'Arewa Kitchen', initials: 'AK', detail: 'Restaurant · 34 menu items', area: 'Nassarawa, Kano', amount: '₦184,200 today', status: 'Online', badge: 'green' },
        { name: 'Zee Small Chops', initials: 'ZS', detail: 'Small-chops vendor · 18 items', area: 'Kano Municipal', amount: '₦96,400 today', status: 'Online', badge: 'green' },
        { name: 'Savour House', initials: 'SH', detail: 'Restaurant · application in review', area: 'Tarauni, Kano', amount: '—', status: 'Reviewing', badge: 'amber' },
        { name: 'Binta Bites', initials: 'BB', detail: 'Small-chops vendor · 12 items', area: 'Gwale, Kano', amount: '₦41,900 today', status: 'Offline', badge: 'gray' }
      ],
      sideTitle: 'Vendor order flow', sideCopy: 'Vendor acceptance happens before customer checkout.',
      infoItems: ['Vendor acceptance countdown is separate from preparation time.', 'Customers pay only after the vendor accepts the order.', 'Rider pickup and recipient delivery verification reuse the core order flow.']
    },
    customers: {
      group: 'Marketplace', title: 'Customers', eyebrow: 'MARKETPLACE / CUSTOMER DIRECTORY',
      description: 'A single customer directory for errands, food and small-chops orders.',
      stats: [['Registered customers', '18,420', 'All service areas', 'users', 'green'], ['Active this month', '7,860', 'Sample activity', 'activity', 'blue'], ['Repeat customers', '64%', '90-day sample rate', 'chart', 'orange'], ['Open support cases', '19', 'Needs operations attention', 'file', 'amber']],
      sectionTitle: 'Customer directory', sectionCopy: 'Keep private customer details limited to authorized support and operations staff.',
      heroTitle: 'Support the whole customer journey', heroCopy: 'Search by account reference, review order history and resolve support requests without exposing payment secrets or unnecessary personal data.',
      rows: [
        { name: 'Aisha Bello', initials: 'AB', detail: 'Customer since Aug 2026', area: 'Nassarawa, Kano', amount: '24 orders', status: 'Active', badge: 'green' },
        { name: 'Musa Sani', initials: 'MS', detail: 'Customer since Jul 2026', area: 'Kano Municipal', amount: '11 orders', status: 'Active', badge: 'green' },
        { name: 'Zainab Yusuf', initials: 'ZY', detail: 'Customer since Sep 2026', area: 'Tarauni, Kano', amount: '8 orders', status: 'Support case', badge: 'amber' }
      ],
      sideTitle: 'Privacy reminders', sideCopy: 'Good support starts with careful access.',
      infoItems: ['Use scoped support permissions to access only assigned cases.', 'Never expose OTPs, full bank details or identity numbers in reports.', 'Log sensitive account access and administrative changes.']
    },
    riders: {
      group: 'People & access', title: 'Riders & fleets', eyebrow: 'PEOPLE / DELIVERY NETWORK',
      description: 'Oversee approved individual riders, company fleets and rider availability.',
      stats: [['Approved riders', '392', '61 company fleet riders', 'bike', 'green'], ['Online now', '126', 'Across selected areas', 'activity', 'blue'], ['Companies', '24', '18 with active fleets', 'building', 'orange'], ['Needs attention', '9', 'KYC or document updates', 'shield', 'amber']],
      sectionTitle: 'Delivery network', sectionCopy: 'Company approval does not replace individual rider approval.',
      heroTitle: 'A trusted, location-aware fleet', heroCopy: 'Only verified and available riders should be eligible for offers. Company fleet managers can work inside their company scope, never across another fleet.',
      rows: [
        { name: 'Halima Ibrahim', initials: 'HI', detail: 'Individual rider · EX-RD-0149', area: 'Nassarawa, Kano', amount: '4.9 rating', status: 'Online', badge: 'green' },
        { name: 'Sadiq Umar', initials: 'SU', detail: 'Kano Express fleet · EX-RD-0092', area: 'Kano Municipal', amount: '4.8 rating', status: 'On delivery', badge: 'blue' },
        { name: 'Amina Garba', initials: 'AG', detail: 'Individual rider · EX-RD-0227', area: 'Tarauni, Kano', amount: '4.7 rating', status: 'Offline', badge: 'gray' }
      ],
      sideTitle: 'Onboarding status', sideCopy: 'Structured review protects applicants and customers.',
      infoItems: ['Collect only necessary identity data through an approved provider.', 'Evidence is stored privately with access and download logs.', 'Route approvals to authorized reviewers; separate sensitive decisions.']
    },
    applications: {
      group: 'People & access', title: 'Applications & KYC', eyebrow: 'PEOPLE / VERIFICATION',
      description: 'Review rider, company and vendor applications with access controls for sensitive evidence.',
      stats: [['In review', '23', 'All application types', 'file', 'amber'], ['Rider applicants', '14', '8 ready for review', 'bike', 'blue'], ['Companies', '4', '2 need documents', 'building', 'orange'], ['Vendors', '5', 'Restaurant and small chops', 'store', 'green']],
      sectionTitle: 'Review queue', sectionCopy: 'Demo metadata only; production evidence access must be assignment- and permission-scoped.',
      heroTitle: 'Human review with clear accountability', heroCopy: 'Application decisions are separate from company and fleet setup. Every sensitive file preview, download and decision should produce an audit event.',
      rows: [
        { name: 'Halima Ibrahim', initials: 'HI', detail: 'Individual rider · Submitted 2h ago', area: 'Kano Municipal', amount: '4 documents', status: 'Ready to review', badge: 'amber' },
        { name: 'Kano Rapid', initials: 'KR', detail: 'Company fleet · In review', area: 'Kano Municipal', amount: '6 documents', status: 'More info needed', badge: 'orange' },
        { name: 'Savour House', initials: 'SH', detail: 'Restaurant · Submitted Oct 18', area: 'Tarauni, Kano', amount: '3 documents', status: 'Assigned', badge: 'blue' }
      ],
      sideTitle: 'KYC safety checklist', sideCopy: 'A demo screen is not an identity-verification provider.',
      infoItems: ['Use an approved liveness and identity provider for production checks.', 'Limit retention, restrict downloads and log every evidence access.', 'Notify applicants when a case is assigned, returned or decided.']
    },
    ledger: {
      group: 'Finance', title: 'Wallet & ledger', eyebrow: 'FINANCE / ACCOUNTING',
      description: 'Auditable financial entries for customer collections, fees, partner earnings and payouts.',
      stats: [['Ledger balance', '₦8.41m', 'Sample reconciled balance', 'wallet', 'green'], ['Today’s collections', '₦1.24m', 'All payment channels', 'banknote', 'blue'], ['Partner earnings', '₦782,600', 'Eligible after completion', 'chart', 'orange'], ['Unreconciled', '₦34,500', '2 transactions', 'receipt', 'amber']],
      sectionTitle: 'Recent ledger entries', sectionCopy: 'Every business event should create immutable, balanced ledger postings.',
      heroTitle: 'A ledger, not a mutable wallet number', heroCopy: 'Track collection, platform fees, rider earnings, vendor shares, refunds and withdrawals as linked transactions with references and reconciliation status.',
      rows: [
        { name: 'LG-006824', initials: 'LG', detail: 'Rider earning · EX-20472', area: 'Amina Garba', amount: '+₦3,900', status: 'Posted', badge: 'green' },
        { name: 'LG-006823', initials: 'LG', detail: 'Platform fee · EX-20472', area: 'Marketplace ledger', amount: '+₦1,100', status: 'Posted', badge: 'green' },
        { name: 'LG-006821', initials: 'LG', detail: 'Vendor earning · EX-20469', area: 'Arewa Kitchen', amount: '+₦7,480', status: 'Pending settlement', badge: 'amber' }
      ],
      sideTitle: 'Financial controls', sideCopy: 'The sample ledger is illustrative and is not connected to a bank.',
      infoItems: ['Use double-entry postings and immutable transaction references.', 'Reserve withdrawals before sending a transfer request.', 'Reconcile signed provider webhooks with status queries.']
    },
    withdrawals: {
      group: 'Finance', title: 'Withdrawals', eyebrow: 'FINANCE / PAYOUTS',
      description: 'Review payout requests and reflect provider-confirmed status accurately.',
      stats: [['Awaiting review', '16', 'Sample pending requests', 'clock', 'amber'], ['Processing', '8', 'Provider transfer initiated', 'activity', 'blue'], ['Paid today', '₦418,700', 'Provider-confirmed', 'banknote', 'green'], ['Needs reconciliation', '2', 'Status query required', 'shield', 'orange']],
      sectionTitle: 'Withdrawal requests', sectionCopy: 'Payout balances should be reserved exactly once and released only after a verified failure.',
      heroTitle: 'Near-real-time payouts, with honest statuses', heroCopy: 'Bank downtime, provider queues, compliance reviews and funding balances can delay transfers. Communicate Processing, Successful and Failed based on provider-confirmed status.',
      rows: [
        { name: 'WD-00184', initials: 'WD', detail: 'Halima Ibrahim · Rider', area: 'GTBank · ending 2048', amount: '₦28,400', status: 'Awaiting review', badge: 'amber' },
        { name: 'WD-00183', initials: 'WD', detail: 'Kano Express · Company', area: 'Access Bank · ending 8621', amount: '₦105,000', status: 'Processing', badge: 'blue' },
        { name: 'WD-00181', initials: 'WD', detail: 'Arewa Kitchen · Vendor', area: 'Moniepoint · ending 4410', amount: '₦42,750', status: 'Successful', badge: 'green' }
      ],
      sideTitle: 'Payout checklist', sideCopy: 'A collection integration is not the same as a payout integration.',
      infoItems: ['Check live-account transfer access and available payout balance.', 'Require approved bank details and step-up authorization for changes.', 'Verify final status through signed webhooks or provider status queries.']
    },
    reconciliation: {
      group: 'Finance', title: 'Reconciliation', eyebrow: 'FINANCE / CONTROL',
      description: 'Compare platform ledger entries with collection and payout provider statements.',
      stats: [['Matched today', '1,246', 'Across configured gateways', 'check', 'green'], ['Needs matching', '12', 'Sample open items', 'receipt', 'amber'], ['Collection variance', '₦34,500', 'Under investigation', 'chart', 'orange'], ['Last import', '09:42', 'Today · UTC', 'clock', 'blue']],
      sectionTitle: 'Open reconciliation items', sectionCopy: 'Match by provider reference, amount, currency and final status.',
      heroTitle: 'Close the loop on every naira', heroCopy: 'Detect duplicate webhooks, delayed settlement, chargebacks and failed transfers before amounts are presented as available earnings.',
      rows: [
        { name: 'TXN-PST-80412', initials: 'TX', detail: 'Customer collection · EX-20475', area: 'Paystack · NGN', amount: '₦12,800', status: 'Amount mismatch', badge: 'orange' },
        { name: 'TXN-MON-14581', initials: 'TX', detail: 'Rider transfer · WD-00179', area: 'Monnify · NGN', amount: '₦19,200', status: 'Pending status', badge: 'amber' },
        { name: 'TXN-FLW-08302', initials: 'TX', detail: 'Vendor collection · EX-20469', area: 'Flutterwave · NGN', amount: '₦9,400', status: 'Matched', badge: 'green' }
      ],
      sideTitle: 'Reconciliation signals', sideCopy: 'Use provider references and ledger entries, not manually edited statuses.',
      infoItems: ['Deduplicate webhook events using provider event identifiers.', 'Keep raw provider responses outside ordinary logs.', 'Create an auditable adjustment rather than changing a posted entry.']
    },
    'order-forms': {
      group: 'Platform', title: 'Dynamic order forms', eyebrow: 'PLATFORM / CONFIGURATION',
      description: 'Versioned, validated fields that adapt to the errand or service customers choose.',
      stats: [['Published forms', '8', 'Versioned templates', 'file', 'green'], ['Active fields', '46', 'Across all form schemas', 'clipboard', 'blue'], ['Conditional rules', '12', 'Configured display logic', 'settings', 'orange'], ['Draft changes', '2', 'Awaiting preview', 'clock', 'amber']],
      sectionTitle: 'Service form catalogue', sectionCopy: 'New form versions do not rewrite historical orders.',
      heroTitle: 'Flexible forms, safe historical records', heroCopy: 'Use approved text, address, date, selection and upload fields. Validate schema changes before publishing; render past orders against the version they were created with.',
      rows: [
        { name: 'General errand', initials: 'GE', detail: 'v3 · 8 fields · Last published Oct 15', area: 'Errands', amount: '2 conditional rules', status: 'Published', badge: 'green' },
        { name: 'Food pickup', initials: 'FP', detail: 'v2 · 6 fields · Last published Oct 12', area: 'Food delivery', amount: '1 conditional rule', status: 'Published', badge: 'green' },
        { name: 'Document delivery', initials: 'DD', detail: 'v1 · 9 fields · Edited Oct 18', area: 'Errands', amount: '3 conditional rules', status: 'Draft', badge: 'amber' }
      ],
      sideTitle: 'Supported fields', sideCopy: 'Build forms from safe, validated components.',
      infoItems: ['Text, number, phone, dropdown, radio and checkbox fields.', 'State, LGA, service area, pickup and destination selectors.', 'Conditional questions, private uploads and delivery instructions.']
    },
    website: {
      group: 'Platform', title: 'Website builder', eyebrow: 'PLATFORM / CONTENT',
      description: 'Manage approved marketing sections, navigation and service pages without executing custom code.',
      stats: [['Published pages', '6', 'Public site pages', 'globe', 'green'], ['Draft edits', '3', 'Not yet visible', 'file', 'amber'], ['Media assets', '42', 'Optimized images', 'store', 'blue'], ['Last published', 'Oct 18', '09:14 AM', 'clock', 'orange']],
      sectionTitle: 'Page library', sectionCopy: 'Layouts are stored as validated content blocks with revision history.',
      heroTitle: 'A local marketplace with a clear story', heroCopy: 'Edit approved page sections, banners, service cards and calls to action. Preview and roll back content versions; never execute arbitrary PHP or JavaScript from the page editor.',
      rows: [
        { name: 'Homepage', initials: 'HP', detail: 'Hero · Services · Trust · Footer', area: 'Public website', amount: 'Published Oct 18', status: 'Published', badge: 'green' },
        { name: 'Service areas', initials: 'SA', detail: 'Coverage by state and LGA', area: 'Public website', amount: '2 draft edits', status: 'Draft', badge: 'amber' },
        { name: 'Become a rider', initials: 'BR', detail: 'Individual and fleet onboarding', area: 'Public website', amount: 'Published Oct 12', status: 'Published', badge: 'green' }
      ],
      sideTitle: 'Publishing safeguards', sideCopy: 'Content controls must never become code execution.',
      infoItems: ['Approved templates, accessible contrast and keyboard navigation.', 'Optimized images and reduced-motion options for low-end phones.', 'Revision history, preview, publish and rollback for every page.']
    },
    settings: {
      group: 'Platform', title: 'Platform settings', eyebrow: 'PLATFORM / CONFIGURATION',
      description: 'Configure operational defaults and integrations with least-privilege access.',
      stats: [['Payment gateways', '2 enabled', 'Sandbox configuration', 'banknote', 'green'], ['Email delivery', 'Operational', 'SMTP test passed', 'mail', 'blue'], ['Acceptance rules', '3 configured', 'By service type', 'clock', 'orange'], ['Security alerts', 'All clear', 'No critical alerts', 'shield', 'amber']],
      sectionTitle: 'Configuration registry', sectionCopy: 'Store secrets encrypted on the server; never expose keys to frontend code.',
      heroTitle: 'A configurable platform with strong guardrails', heroCopy: 'Business policy can be adjusted by authorized administrators. Provider adapters, infrastructure and new business processes still require secure engineering work.',
      rows: [
        { name: 'Paystack', initials: 'PS', detail: 'Collections · Test mode', area: 'Payment gateway', amount: 'Connection checked Oct 18', status: 'Configured', badge: 'green' },
        { name: 'SMTP email', initials: 'EM', detail: 'Transactional notifications', area: 'Notifications', amount: 'Retries enabled', status: 'Operational', badge: 'green' },
        { name: 'Payout limits', initials: 'PL', detail: 'Daily and per-transaction caps', area: 'Finance policy', amount: 'Last updated Oct 12', status: 'Review due', badge: 'amber' }
      ],
      sideTitle: 'Protected settings', sideCopy: 'High-risk changes need stronger authorization and an audit trail.',
      infoItems: ['Encrypt credentials at rest and redact secrets from logs.', 'Separate emergency controls from routine role access.', 'Require two-person review for sensitive financial settings.']
    }
  };

  const state = loadState();
  let activePage = validPage(location.hash.slice(1)) ? location.hash.slice(1) : 'earnings';
  let activeFilter = 'all';
  let ruleSearch = '';
  let selectedLocation = state.location || 'Kano State';
  let editingFormId = null;
  let applicationFilter = 'all';
  let applicationSearch = '';
  let assignmentFilter = 'all';
  let assignmentSearch = '';
  let providerDirectoryFilter = 'all';
  let providerDirectorySearch = '';
  let providerDraft = null;
  let providerCoverageLocationValue = '';
  let providerCoverageAreaValue = '';
  let toastTimer = null;

  function icon(name, className = 'icon') {
    return `<svg class="${className}" aria-hidden="true"><use href="#i-${escapeAttr(name)}"></use></svg>`;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function escapeAttr(value) {
    return escapeHTML(value).replace(/`/g, '&#96;');
  }

  function safeId(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function validPage(page) {
    return page === 'earnings' || page === 'features' || page === 'roles' || page === 'locations' || page === 'overview' || Object.prototype.hasOwnProperty.call(PAGE_META, page);
  }

  function loadState() {
    const initial = {
      rules: structuredCloneSafe(DEFAULT_RULES),
      orders: structuredCloneSafe(DEFAULT_ORDERS),
      ledgerEntries: [],
      forms: structuredCloneSafe(DEFAULT_FORMS),
      applications: structuredCloneSafe(DEFAULT_APPLICATIONS),
      providers: structuredCloneSafe(MATCHING_PROVIDERS),
      features: { ...DEFAULT_FEATURES },
      permissions: structuredCloneSafe(DEFAULT_PERMISSIONS),
      coverage: structuredCloneSafe(DEFAULT_COVERAGE),
      selectedCoverageState: 'Kano State',
      selectedLga: 'Kano Municipal',
      location: 'Kano State',
      activities: []
    };
    initial.providers = providersWithApplicationApprovals(initial.providers, initial.applications);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return initial;
      if (Array.isArray(saved.rules)) initial.rules = saved.rules.filter((rule) => rule && typeof rule === 'object' && rule.id && rule.type && rule.model);
      if (Array.isArray(saved.orders)) {
        initial.orders = saved.orders.filter((order) => {
          const workflow = order && order.workflow === 'vendor' ? 'vendor' : 'errand';
          return order && typeof order === 'object' && typeof order.id === 'string' && ORDER_STEPS[workflow].includes(order.state);
        }).map((order) => {
          const workflow = order.workflow === 'vendor' ? 'vendor' : 'errand';
          return {
            ...order,
            workflow,
            customer: String(order.customer || 'Customer'),
            provider: String(order.provider || 'Awaiting provider'),
            rider: String(order.rider || 'Unassigned'),
            service: String(order.service || 'Errand'),
            area: String(order.area || 'Kano State'),
            total: Math.max(0, Number(order.total) || 0),
            history: Array.isArray(order.history) ? order.history.filter((entry) => entry && ORDER_STEPS[workflow].includes(entry.state)).slice(-20) : [],
            assignment: normalizeSavedAssignment(order.assignment),
            assignmentHistory: normalizeAssignmentHistory(order.assignmentHistory)
          };
        });
        const savedOrderIds = new Set(initial.orders.map((order) => order.id));
        initial.orders.push(...structuredCloneSafe(DEFAULT_ORDERS.filter((order) => !savedOrderIds.has(order.id))));
      }
      if (Array.isArray(saved.forms)) initial.forms = saved.forms.filter((form) => form && typeof form === 'object' && typeof form.id === 'string').slice(0, 100).map(normalizeSavedForm);
      if (Array.isArray(saved.applications)) {
        initial.applications = saved.applications.filter((application) => application && typeof application === 'object' && typeof application.id === 'string').slice(0, 200).map(normalizeSavedApplication);
        const savedApplicationIds = new Set(initial.applications.map((application) => application.id));
        initial.applications.push(...structuredCloneSafe(DEFAULT_APPLICATIONS.filter((application) => !savedApplicationIds.has(application.id))));
      }
      if (Array.isArray(saved.coverage)) initial.coverage = normalizeCoverage(saved.coverage);
      if (typeof saved.selectedCoverageState === 'string') initial.selectedCoverageState = saved.selectedCoverageState;
      const selectedCoverageState = initial.coverage.find((item) => item.name === initial.selectedCoverageState) || initial.coverage[0];
      initial.selectedCoverageState = selectedCoverageState.name;
      if (typeof saved.selectedLga === 'string') initial.selectedLga = saved.selectedLga;
      if (!Array.isArray(saved.coverage) && Array.isArray(saved.customAreas)) {
        const legacyState = initial.coverage.find((item) => item.name === initial.selectedCoverageState) || initial.coverage[0];
        const legacyLga = legacyState.lgas.find((item) => item.name === initial.selectedLga) || legacyState.lgas[0];
        if (legacyLga) legacyLga.areas = [...new Set([...legacyLga.areas, ...saved.customAreas.filter((area) => typeof area === 'string').map((area) => area.trim()).filter(Boolean).slice(0, 100)])].slice(0, 100);
      }
      const selectedLga = selectedCoverageState.lgas.find((item) => item.name === initial.selectedLga) || selectedCoverageState.lgas[0];
      initial.selectedLga = selectedLga ? selectedLga.name : '';
      initial.providers = normalizeSavedProviders(Array.isArray(saved.providers) ? saved.providers : initial.providers, initial.coverage);
      initial.providers = providersWithApplicationApprovals(initial.providers, initial.applications);
      if (Array.isArray(saved.ledgerEntries)) initial.ledgerEntries = normalizeSavedLedgerEntries(saved.ledgerEntries, initial.orders);
      if (saved.features && typeof saved.features === 'object') initial.features = { ...initial.features, ...saved.features };
      if (saved.permissions && typeof saved.permissions === 'object') initial.permissions = { ...initial.permissions, ...saved.permissions };
      if (typeof saved.location === 'string') {
        const previousViews = { 'Kano Municipal': 'Kano Municipal · Kano State', 'Nassarawa LGA': 'Nassarawa · Kano State' };
        initial.location = previousViews[saved.location] || saved.location.slice(0, 100);
      }
      if (Array.isArray(saved.activities)) initial.activities = saved.activities.slice(0, 10);
    } catch (_) {
      // A fresh, usable prototype is more important than a stale or malformed local setting.
    }
    return initial;
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeCoverage(records) {
    if (!Array.isArray(records)) return structuredCloneSafe(DEFAULT_COVERAGE);
    const coverage = [];
    const seenStates = new Set();
    let lgaCount = 0;
    records.slice(0, NIGERIAN_STATES.length).forEach((record) => {
      if (!record || typeof record !== 'object') return;
      const name = NIGERIAN_STATES.find((item) => item.toLowerCase() === String(record.name || '').trim().toLowerCase());
      if (!name || seenStates.has(name)) return;
      seenStates.add(name);
      const seenLgas = new Set();
      const lgas = [];
      (Array.isArray(record.lgas) ? record.lgas : []).slice(0, 774).forEach((lga) => {
        if (!lga || typeof lga !== 'object' || lgaCount >= 774) return;
        const lgaName = String(lga.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        const key = lgaName.toLowerCase();
        if (!lgaName || seenLgas.has(key)) return;
        seenLgas.add(key);
        const seenAreas = new Set();
        const areas = (Array.isArray(lga.areas) ? lga.areas : []).slice(0, 100).map((area) => String(area || '').trim().replace(/\s+/g, ' ').slice(0, 80)).filter((area) => {
          const areaKey = area.toLowerCase();
          if (!area || seenAreas.has(areaKey)) return false;
          seenAreas.add(areaKey);
          return true;
        });
        lgas.push({ name: lgaName, areas });
        lgaCount += 1;
      });
      coverage.push({ name, lgas });
    });
    return coverage.length ? coverage : structuredCloneSafe(DEFAULT_COVERAGE);
  }

  function normalizeFormFields(fields) {
    if (!Array.isArray(fields)) return [];
    return fields.filter((field) => field && typeof field === 'object').slice(0, 100).map((field, index) => ({
      id: String(field.id || `field-${index + 1}`),
      key: String(field.key || `field_${index + 1}`).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 60),
      label: String(field.label || 'New field').slice(0, 100),
      type: Object.prototype.hasOwnProperty.call(FORM_FIELD_TYPES, field.type) ? field.type : 'text',
      required: Boolean(field.required),
      help: String(field.help || '').slice(0, 240),
      options: Array.isArray(field.options) ? field.options.filter((option) => typeof option === 'string').slice(0, 30).map((option) => option.slice(0, 100)) : [],
      dependsOn: String(field.dependsOn || '').slice(0, 60),
      conditionValue: String(field.conditionValue || '').slice(0, 100)
    }));
  }

  function normalizeFormSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;
    return {
      version: Math.max(0, Number(snapshot.version) || 0),
      name: String(snapshot.name || 'Untitled form').slice(0, 100),
      service: String(snapshot.service || 'Errands').slice(0, 60),
      fields: normalizeFormFields(snapshot.fields)
    };
  }

  function normalizeSavedForm(form) {
    const published = normalizeFormSnapshot(form.published);
    return {
      id: String(form.id),
      name: String(form.name || 'Untitled form').slice(0, 100),
      service: String(form.service || 'Errands').slice(0, 60),
      version: Math.max(0, Number(form.version) || 0),
      status: form.status === 'Published' ? 'Published' : (published ? 'Draft changes' : 'Draft'),
      updated: String(form.updated || 'Not published'),
      fields: normalizeFormFields(form.fields),
      published,
      history: Array.isArray(form.history) ? form.history.filter((item) => item && typeof item === 'object').slice(-10).map((item) => ({
        version: Math.max(0, Number(item.version) || 0),
        date: String(item.date || ''),
        fieldCount: Math.max(0, Number(item.fieldCount) || 0),
        name: String(item.name || form.name || '').slice(0, 100),
        service: String(item.service || form.service || '').slice(0, 60),
        fields: normalizeFormFields(item.fields)
      })) : []
    };
  }

  function normalizeSavedApplication(application) {
    const kind = Object.prototype.hasOwnProperty.call(APPLICATION_CHECKLISTS, application.kind) ? application.kind : 'rider';
    const validStatus = Object.prototype.hasOwnProperty.call(APPLICATION_STATUS_LABELS, application.status) ? application.status : 'SUBMITTED';
    const legacyName = application.id === 'APP-RD-0149' && application.name === 'Mariya Adamu' ? 'Halima Ibrahim' : application.id === 'APP-CO-0038' && application.name === 'Northline Logistics' ? 'Kano Rapid' : application.name;
    return {
      id: String(application.id).slice(0, 60),
      kind,
      category: String(application.category || (kind === 'rider' ? 'Individual rider' : kind === 'company' ? 'Company fleet' : 'Vendor')).slice(0, 80),
      name: String(legacyName || 'Applicant').slice(0, 100),
      location: String(application.location || 'Kano State').slice(0, 100),
      submitted: String(application.submitted || 'Recently').slice(0, 60),
      status: validStatus,
      reviewer: String(application.reviewer || '').slice(0, 80),
      evidence: Array.isArray(application.evidence) ? application.evidence.filter((item) => item && typeof item === 'object').slice(0, 30).map((item) => ({ label: String(item.label || 'Evidence item').slice(0, 100), status: String(item.status || 'Received').slice(0, 40) })) : [],
      checks: APPLICATION_CHECKLISTS[kind].map((_, index) => Boolean(Array.isArray(application.checks) && application.checks[index])),
      lastNote: String(application.lastNote || '').slice(0, 500),
      history: Array.isArray(application.history) ? application.history.filter((event) => event && typeof event === 'object').slice(-30).map((event) => ({ title: String(event.title || 'Application updated').slice(0, 100), actor: String(event.actor || 'Reviewer').slice(0, 80), at: String(event.at || '').slice(0, 50), note: String(event.note || '').slice(0, 500) })) : []
    };
  }

  function normalizeSavedAssignment(assignment) {
    if (!assignment || typeof assignment !== 'object' || !['rider', 'vendor'].includes(assignment.stage) || !['OFFERED', 'ACCEPTED', 'DECLINED', 'TIMED_OUT'].includes(assignment.status)) return null;
    const provider = MATCHING_PROVIDERS.find((item) => item.id === assignment.providerId);
    if (!provider) return null;
    return { stage: assignment.stage, providerId: provider.id, providerName: provider.name, status: assignment.status, at: String(assignment.at || '').slice(0, 50), respondedAt: String(assignment.respondedAt || '').slice(0, 50) };
  }

  function normalizeAssignmentHistory(events) {
    if (!Array.isArray(events)) return [];
    return events.filter((event) => event && typeof event === 'object').slice(-30).map((event) => ({
      stage: ['rider', 'vendor'].includes(event.stage) ? event.stage : 'rider',
      title: String(event.title || 'Assignment updated').slice(0, 100),
      providerId: String(event.providerId || '').slice(0, 60),
      providerName: String(event.providerName || 'Unassigned').slice(0, 100),
      actor: String(event.actor || 'Dispatch Manager (demo)').slice(0, 80),
      at: String(event.at || '').slice(0, 50),
      note: String(event.note || '').slice(0, 300)
    }));
  }

  function normalizeSavedLedgerEntries(entries, orders) {
    const orderIds = new Set(orders.map((order) => order.id));
    const providersById = new Map(MATCHING_PROVIDERS.map((provider) => [provider.id, provider]));
    const seenBeneficiaries = new Set();
    return entries.filter((entry) => entry && typeof entry === 'object').map((entry) => {
      const provider = providersById.get(String(entry.providerId || ''));
      const orderId = String(entry.orderId || '').slice(0, 60);
      const model = ['percentage', 'fixed', 'per_request'].includes(entry.model) ? entry.model : '';
      const basis = Object.prototype.hasOwnProperty.call(BASIS_LABELS, entry.basis) ? entry.basis : '';
      const basisAmount = Number(entry.basisAmount);
      const amount = Number(entry.amount);
      const key = `${orderId}:${provider?.id || ''}`;
      if (!provider || !orderIds.has(orderId) || !model || !basis || !entry.id || seenBeneficiaries.has(key) || !Number.isInteger(basisAmount) || basisAmount <= 0 || !Number.isInteger(amount) || amount < 0 || amount > basisAmount) return null;
      seenBeneficiaries.add(key);
      const rate = Number(entry.rate);
      const fixedAmount = Number(entry.fixedAmount);
      return {
        id: String(entry.id).slice(0, 80),
        orderId,
        providerId: provider.id,
        beneficiaryName: String(entry.beneficiaryName || provider.name).slice(0, 100),
        beneficiaryType: provider.type,
        role: provider.type === 'restaurant' || provider.type === 'small_chops' ? 'vendor' : 'rider',
        ruleId: String(entry.ruleId || '').slice(0, 80),
        ruleName: String(entry.ruleName || 'Earning rule').slice(0, 100),
        ruleScope: String(entry.ruleScope || '').slice(0, 120),
        model,
        rate: Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0,
        fixedAmount: Number.isFinite(fixedAmount) && fixedAmount >= 0 ? Math.round(fixedAmount) : 0,
        basis,
        basisAmount: Math.round(basisAmount),
        amount: Math.round(amount),
        status: 'PENDING_SETTLEMENT',
        createdAt: String(entry.createdAt || '').slice(0, 50)
      };
    }).filter(Boolean);
  }

  function normalizeProviderCoverage(scopes, coverageCatalog = state.coverage) {
    if (!Array.isArray(scopes)) return [];
    return scopes.filter((scope) => scope && typeof scope === 'object').slice(0, 100).map((scope) => {
      const coverageState = coverageCatalog.find((item) => item.name === scope.state);
      const lga = coverageState?.lgas.find((item) => item.name === scope.lga);
      if (!coverageState || !lga) return null;
      const configuredAreas = new Set(lga.areas.map((area) => area.toLowerCase()));
      if (!Array.isArray(scope.areas)) return null;
      const sourceAreas = scope.areas.slice(0, 100);
      const areas = [...new Set(sourceAreas.map((area) => String(area || '').trim()).filter((area) => configuredAreas.has(area.toLowerCase())))];
      if (sourceAreas.length && !areas.length) return null;
      return { state: coverageState.name, lga: lga.name, areas };
    }).filter(Boolean);
  }

  function normalizeSavedProviders(records, coverageCatalog = state.coverage) {
    const savedById = new Map((Array.isArray(records) ? records : []).filter((provider) => provider && typeof provider === 'object').map((provider) => [String(provider.id), provider]));
    return MATCHING_PROVIDERS.map((base) => {
      const saved = savedById.get(base.id) || {};
      const numericCapacity = Number(saved.capacity);
      return {
        ...base,
        online: typeof saved.online === 'boolean' ? saved.online : base.online,
        available: typeof saved.available === 'boolean' ? saved.available : base.available,
        capacity: Number.isFinite(numericCapacity) ? Math.min(50, Math.max(1, Math.floor(numericCapacity))) : base.capacity,
        coverage: normalizeProviderCoverage(Array.isArray(saved.coverage) ? saved.coverage : base.coverage, coverageCatalog)
      };
    });
  }

  function providersWithApplicationApprovals(providers, applications) {
    const applicationsById = new Map((Array.isArray(applications) ? applications : []).map((application) => [application.id, application]));
    return providers.map((provider) => {
      const partnerApplication = provider.applicationId ? applicationsById.get(provider.applicationId) : null;
      const companyApplication = provider.companyApplicationId ? applicationsById.get(provider.companyApplicationId) : null;
      return {
        ...provider,
        approved: provider.applicationId ? partnerApplication?.status === 'APPROVED' : Boolean(provider.approved),
        companyApproved: provider.companyApplicationId ? companyApplication?.status === 'APPROVED' : Boolean(provider.companyApproved)
      };
    });
  }

  function syncProviderApplicationApprovals() {
    state.providers = providersWithApplicationApprovals(state.providers, state.applications);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      toast('Could not save in this browser. The change will last only until this tab closes.');
    }
  }

  function formatNaira(amount, decimals = false) {
    const safe = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN',
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0
    }).format(safe);
  }

  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('') || 'EX';
  }

  function ruleTitle(rule) {
    return rule.beneficiary || (BENEFICIARIES.find((item) => item.type === rule.type) || {}).label || 'Partner';
  }

  function modeRateText(rule) {
    if (rule.model === 'percentage') return `${Number(rule.rate) || 0}%`;
    if (rule.model === 'fixed') return formatNaira(rule.amount);
    return 'Set for each request';
  }

  function modeSummary(rule) {
    if (rule.model === 'percentage') return `${Number(rule.rate) || 0}% of eligible base`;
    if (rule.model === 'fixed') return `${formatNaira(rule.amount)} per completed order`;
    return 'Amount entered per order';
  }

  function addActivity(title, detail, amount = '') {
    state.activities.unshift({
      title, detail, amount,
      time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
    });
    state.activities = state.activities.slice(0, 6);
  }

  function updateTopbar() {
    const current = PAGE_META[activePage];
    const breadcrumb = document.getElementById('breadcrumbCurrent');
    if (breadcrumb) breadcrumb.textContent = activePage === 'earnings' ? 'Finance' : ((current && current.group) || (activePage === 'roles' || activePage === 'applications' || activePage === 'riders' ? 'People & access' : activePage === 'features' || activePage === 'locations' ? 'Platform' : 'Workspace'));
    const date = document.getElementById('currentDate');
    if (date) {
      date.textContent = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date());
    }
    const locationLabel = document.getElementById('currentLocation');
    if (locationLabel) locationLabel.textContent = selectedLocation;
    const locationPopover = document.getElementById('locationPopover');
    if (locationPopover) {
      const options = [{ value: 'All locations', label: 'All locations' }];
      state.coverage.forEach((coverageState) => {
        options.push({ value: coverageState.name, label: coverageState.name });
        coverageState.lgas.forEach((lga) => {
          options.push({ value: `${lga.name} · ${coverageState.name}`, label: `${lga.name} · ${coverageState.name}` });
        });
      });
      if (!options.some((option) => option.value === selectedLocation)) options.push({ value: selectedLocation, label: `${selectedLocation} · saved view` });
      locationPopover.innerHTML = `<span class="popover-label">OPERATING VIEW</span>${options.map((option) => `<button class="popover-option ${option.value === selectedLocation ? 'selected' : ''}" type="button" data-location="${escapeAttr(option.value)}">${escapeHTML(option.label)}${option.value === selectedLocation ? icon('check') : ''}</button>`).join('')}`;
    }
  }

  function render() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
      const isActive = link.dataset.page === activePage;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    updateTopbar();
    if (activePage === 'earnings') main.innerHTML = renderEarningsPage();
    else if (activePage === 'live-orders') main.innerHTML = renderLiveOrdersPage();
    else if (activePage === 'assignment-queue') main.innerHTML = renderAssignmentQueuePage();
    else if (activePage === 'order-forms') main.innerHTML = renderFormsPage();
    else if (activePage === 'features') main.innerHTML = renderFeaturesPage();
    else if (activePage === 'applications') main.innerHTML = renderApplicationsPage();
    else if (activePage === 'roles') main.innerHTML = renderRolesPage();
    else if (activePage === 'ledger') main.innerHTML = renderLedgerPage();
    else if (activePage === 'locations') main.innerHTML = renderLocationsPage();
    else if (activePage === 'overview') main.innerHTML = renderOverviewPage();
    else if (activePage === 'riders' || activePage === 'vendors') main.innerHTML = renderProviderDirectoryPage(activePage);
    else main.innerHTML = renderStandardPage(activePage);
    bindPageInteractions();
  }

  function renderPageHeading(title, eyebrow, description, buttons = '') {
    return `<div class="page-heading">
      <div class="heading-copy"><div class="eyebrow">${escapeHTML(eyebrow)}</div><h1>${escapeHTML(title)}</h1><p class="page-description">${escapeHTML(description)}</p></div>
      <div class="heading-actions">${buttons}</div>
    </div>`;
  }

  function renderStatCards(stats) {
    return `<div class="stats-grid">${stats.map((stat, index) => {
      const [label, value, note, symbol, color] = stat;
      const safeColor = ['orange', 'green', 'blue', 'amber'].includes(color) ? color : 'green';
      return `<article class="stat-card"><div class="stat-icon ${safeColor}">${icon(symbol)}</div><div class="stat-info"><div class="stat-label">${escapeHTML(label)}${index === 0 ? '' : ''}</div><div class="stat-value">${escapeHTML(value)}</div><div class="stat-note"><span class="${note.includes('%') ? 'positive' : 'neutral'}">${note.includes('%') ? `${icon('arrow-up')}${escapeHTML(note)}` : escapeHTML(note)}</span></div></div></article>`;
    }).join('')}</div>`;
  }

  function renderEarningsPage() {
    const activeRules = state.rules.filter((rule) => rule.active).length;
    const orderLinkedTotal = state.ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const pendingOrderLinkedTotal = state.ledgerEntries.filter((entry) => entry.status === 'PENDING_SETTLEMENT').reduce((sum, entry) => sum + entry.amount, 0);
    const hasOrderLinkedEarnings = state.ledgerEntries.length > 0;
    const averageOrderLinkedShare = state.ledgerEntries.reduce((sum, entry) => sum + entry.basisAmount, 0) > 0
      ? `${(orderLinkedTotal / state.ledgerEntries.reduce((sum, entry) => sum + entry.basisAmount, 0) * 100).toFixed(1)}%`
      : '82.4%';
    const buttons = `<button class="button button-secondary" type="button" data-page="ledger">${icon('receipt')}<span>View ledger</span></button><button class="button button-secondary" type="button" data-action="export-rules">${icon('download')}<span>Export rules</span></button><button class="button button-primary" type="button" data-action="new-rule">${icon('plus')}<span>New earning rule</span></button>`;
    const stats = [
      [hasOrderLinkedEarnings ? 'Order-linked earnings' : 'Partner earnings · MTD', hasOrderLinkedEarnings ? formatNaira(orderLinkedTotal) : '₦14.82m', hasOrderLinkedEarnings ? `${state.ledgerEntries.length} local calculated line${state.ledgerEntries.length === 1 ? '' : 's'}` : '12.6% vs. last month', 'banknote', 'orange'],
      ['Pending settlement', hasOrderLinkedEarnings ? formatNaira(pendingOrderLinkedTotal) : '₦684,200', hasOrderLinkedEarnings ? 'New demo lines · not paid' : '42 completed orders', 'clock', 'amber'],
      ['Average partner share', averageOrderLinkedShare, hasOrderLinkedEarnings ? 'Across calculated demo bases' : 'Across completed orders', 'chart', 'blue'],
      ['Active earning rules', String(activeRules), `${state.rules.length} configured in demo`, 'shield', 'green']
    ];
    return `<div class="page earnings-page">
      ${renderPageHeading('Earnings & commissions', 'FINANCE / PAYOUT POLICY', 'Set transparent, auditable earnings for individual riders, company riders, restaurants and small-chops vendors.', buttons)}
      ${renderStatCards(stats)}
      <div class="content-grid">
        <section class="card rules-card" aria-labelledby="rulesHeading">
          <div class="card-header"><div><h2 class="card-title" id="rulesHeading">Earning rules</h2><p class="card-subtitle">Illustrative defaults · Set a percentage, a custom fixed amount or an amount per request.</p></div><span class="badge badge-green"><span class="health-pulse" style="width:5px;height:5px;box-shadow:none"></span>${activeRules} active</span></div>
          <div class="rules-toolbar">
            <div class="rule-filters" role="group" aria-label="Filter earning rules">
              <button type="button" class="filter-button ${activeFilter === 'all' ? 'active' : ''}" data-rule-filter="all">All <span>${state.rules.length}</span></button>
              <button type="button" class="filter-button ${activeFilter === 'percentage' ? 'active' : ''}" data-rule-filter="percentage">Percentage</button>
              <button type="button" class="filter-button ${activeFilter === 'fixed' ? 'active' : ''}" data-rule-filter="fixed">Custom amount</button>
              <button type="button" class="filter-button ${activeFilter === 'per_request' ? 'active' : ''}" data-rule-filter="per_request">Per request</button>
            </div>
            <label class="search-field"><span class="sr-only">Search earning rules</span>${icon('search')}<input id="ruleSearch" type="search" placeholder="Search beneficiaries…" value="${escapeAttr(ruleSearch)}"></label>
          </div>
          <div class="table-scroll"><table class="rules-table"><thead><tr><th>Beneficiary</th><th>Method</th><th>Default earning</th><th>Calculation basis</th><th>Applies to</th><th>Status</th><th><span class="sr-only">Edit</span></th></tr></thead><tbody id="ruleTableBody">${renderRuleRows()}</tbody></table></div>
          <div class="table-foot"><span><strong>${filteredRules().length}</strong> rule${filteredRules().length === 1 ? '' : 's'} shown · Changes are stored in this browser</span><button class="text-button" type="button" data-action="rule-help">How earning rules work ${icon('arrow-right')}</button></div>
        </section>
        <aside class="card preview-card" aria-labelledby="previewTitle">
          <div class="preview-header"><div class="preview-heading-line"><h2 class="preview-title" id="previewTitle">${icon('chart')} Payout preview</h2><span class="live-chip">Live calculator</span></div><p class="preview-copy">Try a rule against an eligible order amount. This does not create a payout.</p></div>
          <div class="preview-form">
            <div class="form-field"><label class="field-label" for="previewRule">Beneficiary &amp; rule</label><select class="select-control" id="previewRule">${renderPreviewOptions()}</select></div>
            <div class="form-field"><label class="field-label" for="previewBase">Eligible order amount <small id="previewBasisHint">(delivery fee)</small></label><div class="input-with-prefix"><span>₦</span><input class="input-control" id="previewBase" type="number" min="0" step="100" value="6500" inputmode="decimal"></div></div>
            <div class="form-field" id="previewManualField" hidden><label class="field-label" for="previewManual">Amount set for this request</label><div class="input-with-prefix"><span>₦</span><input class="input-control" id="previewManual" type="number" min="0" step="100" placeholder="Enter payout amount" inputmode="decimal"></div></div>
          </div>
          <div class="preview-result" id="previewResult" aria-live="polite"></div>
          <div class="preview-warning" id="previewWarning" hidden>${icon('info')}<span></span></div>
        </aside>
      </div>
      <div class="rule-note">${icon('shield')}<span><strong>Settlement guardrail.</strong> Earnings become withdrawable only after a completed order and verified payment. Amounts are calculated from the configured eligible base; tips, taxes and refunds are handled separately. Production changes should be versioned, permission-checked and written to an immutable ledger.</span></div>
      ${renderActivityCard()}
    </div>`;
  }

  function filteredRules() {
    const query = ruleSearch.trim().toLowerCase();
    return state.rules.filter((rule) => {
      if (activeFilter !== 'all' && rule.model !== activeFilter) return false;
      if (!query) return true;
      const text = [ruleTitle(rule), rule.scope, BASIS_LABELS[rule.basis], ...(rule.services || [])].join(' ').toLowerCase();
      return text.includes(query);
    });
  }

  function renderRuleRows() {
    const rules = filteredRules();
    if (!rules.length) return `<tr><td colspan="7"><div class="empty-state">No matching earning rules. Try another filter or create a new rule.</div></td></tr>`;
    return rules.map((rule) => {
      const type = TYPE_COLORS[rule.type] || 'rider';
      const iconName = TYPE_ICONS[rule.type] || 'users';
      const modelClass = rule.model === 'percentage' ? 'method-percentage' : rule.model === 'fixed' ? 'method-fixed' : 'method-per-request';
      const methodIcon = rule.model === 'percentage' ? 'chart' : rule.model === 'fixed' ? 'banknote' : 'edit';
      const methodShort = MODE_SHORT[rule.model] || 'Custom';
      const base = BASIS_LABELS[rule.basis] || 'Eligible order amount';
      return `<tr>
        <td><div class="beneficiary-cell"><span class="beneficiary-avatar ${type}">${icon(iconName)}</span><span><span class="beneficiary-name">${escapeHTML(ruleTitle(rule))}</span><span class="beneficiary-meta">${escapeHTML(rule.scope || 'Custom scope')}</span></span></div></td>
        <td class="method-cell"><span class="method-pill ${modelClass}">${icon(methodIcon)}${escapeHTML(methodShort)}</span></td>
        <td><div class="rate-primary">${escapeHTML(modeRateText(rule))}</div><div class="rate-secondary">${escapeHTML(rule.model === 'percentage' ? 'of eligible base' : rule.model === 'fixed' ? 'per completed order' : 'set per order')}</div></td>
        <td><span class="basis-label">${escapeHTML(base)}</span></td>
        <td><span class="scope-label">${escapeHTML((rule.services || []).join(', ') || 'All services')}</span></td>
        <td><span class="row-controls"><button class="status-switch" type="button" role="switch" aria-checked="${Boolean(rule.active)}" aria-label="${rule.active ? 'Deactivate' : 'Activate'} ${escapeAttr(ruleTitle(rule))}" data-action="toggle-rule" data-id="${escapeAttr(rule.id)}"></button><span class="status-label">${rule.active ? 'Active' : 'Paused'}</span></span></td>
        <td><button class="icon-action" type="button" aria-label="Edit ${escapeAttr(ruleTitle(rule))} rule" data-action="edit-rule" data-id="${escapeAttr(rule.id)}">${icon('edit')}</button></td>
      </tr>`;
    }).join('');
  }

  function renderPreviewOptions() {
    const active = state.rules.filter((rule) => rule.active);
    if (!active.length) return '<option value="">No active rules</option>';
    return active.map((rule) => `<option value="${escapeAttr(rule.id)}">${escapeHTML(ruleTitle(rule))} · ${escapeHTML(MODE_SHORT[rule.model] || 'Custom')}</option>`).join('');
  }

  function renderActivityCard() {
    const fallback = [
      { title: 'Earnings rule published', detail: 'Individual rider · Default rule', amount: '78% share', time: '10:42 AM' },
      { title: 'Vendor settlement completed', detail: 'Arewa Kitchen · 14 orders', amount: '₦68,420', time: '09:18 AM' },
      { title: 'Payout rule reviewed', detail: 'Company fleet rider · Kano Express', amount: '72% share', time: 'Yesterday' }
    ];
    const activities = state.activities.length ? state.activities.concat(fallback).slice(0, 3) : fallback;
    return `<section class="card activity-card"><div class="activity-head"><div><h2 class="card-title">Recent earning activity</h2><p class="card-subtitle">Illustrative entries plus rule changes and order-linked calculations in this browser.</p></div><button type="button" class="text-button" data-action="audit-info">View audit trail ${icon('arrow-right')}</button></div><div class="activity-list">${activities.map((item) => `<div class="activity-row"><span class="activity-icon">${icon('shield')}</span><div class="activity-main"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small></div><strong class="activity-amount">${escapeHTML(item.amount || '')}</strong><span class="activity-time">${escapeHTML(item.time || '')}</span></div>`).join('')}</div></section>`;
  }

  function updatePreview() {
    const ruleSelect = document.getElementById('previewRule');
    const baseInput = document.getElementById('previewBase');
    const manualInput = document.getElementById('previewManual');
    const manualField = document.getElementById('previewManualField');
    const result = document.getElementById('previewResult');
    const warning = document.getElementById('previewWarning');
    if (!ruleSelect || !baseInput || !result) return;
    const rule = state.rules.find((item) => item.id === ruleSelect.value && item.active);
    const amountBase = Math.max(0, Number(baseInput.value) || 0);
    if (!rule) {
      if (manualField) manualField.hidden = true;
      result.innerHTML = `<div class="result-caption">Estimated partner payout <strong>${icon('info')}No active rule</strong></div><div class="payout-amount">${formatNaira(0)}</div><div class="result-details"><div class="result-line"><span>Eligible order amount</span><strong>${formatNaira(amountBase)}</strong></div></div>`;
      if (warning) { warning.hidden = false; warning.querySelector('span').textContent = 'Enable an earning rule to calculate an example payout.'; }
      return;
    }
    if (manualField) manualField.hidden = rule.model !== 'per_request';
    const basisHint = document.getElementById('previewBasisHint');
    if (basisHint) basisHint.textContent = `(${(BASIS_LABELS[rule.basis] || 'eligible base').toLowerCase()})`;
    let payout = 0;
    let hasManualAmount = true;
    if (rule.model === 'percentage') payout = Math.round(amountBase * (Number(rule.rate) || 0)) / 100;
    if (rule.model === 'fixed') payout = Number(rule.amount) || 0;
    if (rule.model === 'per_request') {
      hasManualAmount = manualInput && manualInput.value !== '' && Number.isFinite(Number(manualInput.value));
      payout = hasManualAmount ? Math.max(0, Number(manualInput.value)) : 0;
    }
    const remainder = amountBase - payout;
    const displayPayout = hasManualAmount ? formatNaira(payout) : '—';
    let status = 'Estimated';
    if (!hasManualAmount) status = 'Enter amount';
    else if (payout > amountBase) status = 'Over eligible base';
    const resultLabel = rule.model === 'percentage' ? `${Number(rule.rate) || 0}% rule` : rule.model === 'fixed' ? 'Fixed payout' : 'Operator-set amount';
    result.innerHTML = `<div class="result-caption"><span>Estimated partner payout</span><strong>${icon('check')} ${escapeHTML(status)}</strong></div><div class="payout-amount">${escapeHTML(displayPayout)}</div><div class="result-details"><div class="result-line"><span>${escapeHTML(ruleTitle(rule))} · ${escapeHTML(resultLabel)}</span><strong>${escapeHTML(rule.model === 'percentage' ? `${Number(rule.rate) || 0}%` : rule.model === 'fixed' ? formatNaira(rule.amount) : hasManualAmount ? formatNaira(payout) : 'Set per order')}</strong></div><div class="result-line"><span>Eligible amount</span><strong>${formatNaira(amountBase)}</strong></div><div class="result-line"><span>Remaining before other fees</span><strong class="${remainder >= 0 ? 'retained-value' : ''}">${formatNaira(remainder)}</strong></div></div>`;
    if (warning) {
      const message = !hasManualAmount
        ? 'Enter the amount an authorized operator would set for this individual request.'
        : payout > amountBase
          ? 'Payout exceeds the eligible base. Production settlement should reject this unless an independently authorized platform subsidy is recorded.'
          : rule.model === 'per_request'
            ? 'The entered amount is a preview only. A production endpoint must validate the setter’s permission, order scope and available balance.'
            : 'Illustrative calculation only. A production ledger must also apply refunds, commissions, taxes and settlement status.';
      warning.hidden = false;
      warning.querySelector('span').textContent = message;
    }
  }

  function orderNextState(order) {
    const path = ORDER_STEPS[order.workflow] || ORDER_STEPS.errand;
    const currentIndex = path.indexOf(order.state);
    return currentIndex >= 0 && currentIndex < path.length - 1 ? path[currentIndex + 1] : null;
  }

  function orderBadgeColor(status) {
    if (status === 'ON_TRANSIT' || status === 'PICKUP_VERIFIED') return 'blue';
    if (status === 'COMPLETED') return 'green';
    if (status === 'PREPARING' || status === 'READY_FOR_PICKUP' || status === 'VENDOR_ACCEPTED') return 'orange';
    if (status === 'PAYMENT_VERIFIED' || status === 'DELIVERY_VERIFIED') return 'green';
    return 'amber';
  }

  function renderLiveOrdersPage() {
    const orders = state.orders || [];
    const openCount = orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.state)).length;
    const waitingCount = orders.filter((order) => order.state === 'REQUESTED').length;
    const transitCount = orders.filter((order) => order.state === 'ON_TRANSIT').length;
    const completedCount = orders.filter((order) => order.state === 'COMPLETED').length;
    const stats = [
      ['Open orders', String(openCount), 'Sample workflow records', 'activity', 'green'],
      ['Waiting for provider', String(waitingCount), 'Acceptance step required', 'clock', 'amber'],
      ['On transit', String(transitCount), 'Pickup confirmed first', 'bike', 'blue'],
      ['Completed', String(completedCount), 'Settlement remains separate', 'check', 'orange']
    ];
    const rows = orders.map((order) => {
      const stateLabel = ORDER_STATE_LABELS[order.state] || order.state;
      const provider = order.rider && order.rider !== 'Unassigned' ? `${order.provider} · ${order.rider}` : order.provider;
      return `<tr>
        <td><div class="table-person"><span class="table-avatar">${icon('package')}</span><span><strong>${escapeHTML(order.id)}</strong><small>${escapeHTML(order.service)} · ${escapeHTML(order.customer)}</small></span></div></td>
        <td><span class="basis-label">${escapeHTML(provider)}</span></td>
        <td><span class="basis-label">${escapeHTML(order.area)}</span></td>
        <td><span class="rate-primary">${formatNaira(order.total)}</span></td>
        <td><span class="badge badge-${orderBadgeColor(order.state)}">${escapeHTML(stateLabel)}</span></td>
        <td><button class="button button-secondary order-open-button" type="button" data-action="open-order" data-id="${escapeAttr(order.id)}">Workflow ${icon('arrow-right')}</button></td>
      </tr>`;
    }).join('');
    const buttons = `<button class="button button-secondary" type="button" data-action="module-help">${icon('info')}<span>State machine notes</span></button><button class="button button-primary" type="button" data-action="add-test-order">${icon('plus')}<span>Add test order</span></button>`;
    return `<div class="page live-orders-page">
      ${renderPageHeading('Live orders', 'WORKSPACE / CONTROLLED WORKFLOW', 'Advance sample orders through valid states only. Every action below is a simulation; it does not verify a real payment, code or recipient.', buttons)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>One event at a time. No status shortcuts.</h2><p>Errands and vendor orders have distinct acceptance and preparation paths, then share the same payment, pickup, transit and recipient-confirmation flow.</p></div><span class="module-hero-badge">${icon('shield')}Transitions are sequential · Demo only</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">Order workflow queue</h2><p class="card-subtitle">Open an order to see its progression and perform its next permitted transition.</p></div><span class="badge badge-blue">${orders.length} sample orders</span></div>
        <div class="table-scroll"><table class="module-table live-orders-table"><thead><tr><th>Order / customer</th><th>Provider / rider</th><th>Pickup area</th><th>Order total</th><th>Current state</th><th>Action</th></tr></thead><tbody>${rows || '<tr><td colspan="6"><div class="empty-state">No sample orders yet. Add a test order to try the workflow.</div></td></tr>'}</tbody></table></div>
        <div class="table-foot"><span>State is advanced only through the next allowed event</span><span>Sample data · local browser</span></div>
      </section>
      <div class="rule-note">${icon('shield')}<span><strong>Production guardrail.</strong> The PHP API must independently validate the authenticated actor, order scope, payment provider status, pickup token and recipient OTP. Do not treat these browser-only transitions as verification or settlement.</span></div>
    </div>`;
  }

  function assignmentNormalize(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s+lga$/, '');
  }

  function canonicalState(value) {
    const normalized = assignmentNormalize(value);
    return NIGERIAN_STATES.find((item) => {
      const stateKey = item.toLowerCase();
      return stateKey === normalized || stateKey.replace(/ state$/, '') === normalized || (item === 'Federal Capital Territory' && normalized === 'fct');
    }) || '';
  }

  function parseAssignmentLocation(value) {
    const source = String(value || '').trim();
    if (!source) return { state: '', place: '' };
    if (source === 'All locations') return { state: '', place: '' };
    let place = source;
    let stateName = '';
    if (source.includes('·')) {
      const parts = source.split('·');
      place = parts.shift().trim();
      stateName = canonicalState(parts.join('·'));
    } else if (source.includes(',')) {
      const parts = source.split(',');
      place = parts.shift().trim();
      stateName = canonicalState(parts.join(','));
    } else {
      stateName = canonicalState(source);
      if (stateName) place = '';
    }
    place = place.trim().replace(/\s+(?:LGA|local government area)$/i, '');
    return { state: stateName, place, placeKey: assignmentNormalize(place) };
  }

  function resolveConfiguredLocation(value) {
    const parsed = parseAssignmentLocation(value);
    const matchingStates = state.coverage.filter((item) => !parsed.state || item.name === parsed.state);
    for (const coverageState of matchingStates) {
      if (!parsed.placeKey) return { state: coverageState, lga: null, area: null };
      for (const lga of coverageState.lgas) {
        if (assignmentNormalize(lga.name) === parsed.placeKey) return { state: coverageState, lga, area: null };
        const area = lga.areas.find((item) => assignmentNormalize(item) === parsed.placeKey);
        if (area) return { state: coverageState, lga, area };
      }
    }
    return null;
  }

  function providerCoversLocation(provider, location) {
    const resolved = resolveConfiguredLocation(location);
    if (!resolved) return false;
    return provider.coverage.some((scope) => {
      if (scope.state !== resolved.state.name) return false;
      if (!resolved.lga) return !scope.lga;
      if (scope.lga !== resolved.lga.name) return false;
      if (!resolved.area) return !Array.isArray(scope.areas) || scope.areas.length === 0;
      if (!Array.isArray(scope.areas) || scope.areas.length === 0) return true;
      return scope.areas.some((area) => assignmentNormalize(area) === assignmentNormalize(resolved.area));
    });
  }

  function assignmentStage(order) {
    if (order.state === 'REQUESTED') return order.workflow === 'vendor' ? 'vendor' : 'rider';
    if (order.workflow === 'vendor' && order.state === 'READY_FOR_PICKUP') {
      if (['Unassigned', 'Pending fleet assignment', 'Pending rider assignment'].includes(order.rider)) return 'rider';
      if (order.assignment?.stage === 'rider' && ['OFFERED', 'ACCEPTED', 'DECLINED', 'TIMED_OUT'].includes(order.assignment.status)) return 'rider';
    }
    return null;
  }

  function assignmentStageLabel(order, stage) {
    if (stage === 'vendor') return /small.?chops/i.test(order.service) ? 'Match small-chops vendor' : 'Match restaurant';
    return order.workflow === 'vendor' ? 'Assign pickup rider' : 'Assign errand rider';
  }

  function requiredProviderType(order, stage) {
    if (stage === 'rider') return ['individual_rider', 'company_rider'];
    return /small.?chops/i.test(order.service) ? ['small_chops'] : ['restaurant'];
  }

  function requiredServiceGroup(order, stage) {
    if (stage === 'vendor') return /small.?chops/i.test(order.service) ? 'small_chops' : 'restaurant';
    return order.workflow === 'vendor' ? 'delivery' : 'errand';
  }

  function providerLoad(provider, excludeOrderId = '') {
    return state.orders.filter((order) => {
      if (order.id === excludeOrderId || ['COMPLETED', 'CANCELLED'].includes(order.state)) return false;
      if (['individual_rider', 'company_rider'].includes(provider.type)) return order.rider === provider.name;
      return order.workflow === 'vendor' && order.provider === provider.name && ['REQUESTED', 'VENDOR_ACCEPTED', 'PAYMENT_VERIFIED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.state);
    }).length;
  }

  function providerEligibility(provider, order, stage, excludeOrderId = '') {
    const reasons = [];
    if (!provider.approved) reasons.push('Partner approval is not complete');
    if (provider.type === 'company_rider' && !provider.companyApproved) reasons.push('Company fleet approval is not complete');
    if (!provider.online) reasons.push('Currently offline');
    if (!provider.available) reasons.push('Marked unavailable');
    const load = providerLoad(provider, excludeOrderId);
    if (load >= provider.capacity) reasons.push('At configured assignment capacity');
    if (!provider.serviceGroups.includes(requiredServiceGroup(order, stage))) reasons.push('Service category does not match');
    if (!providerCoversLocation(provider, order.area)) reasons.push('Pickup is outside configured coverage');
    return { eligible: reasons.length === 0, reasons, load };
  }

  function assignmentCandidates(order, stage) {
    const types = requiredProviderType(order, stage);
    return state.providers.filter((provider) => types.includes(provider.type)).map((provider) => ({
      provider,
      ...providerEligibility(provider, order, stage)
    })).sort((a, b) => Number(b.eligible) - Number(a.eligible) || a.load - b.load || a.provider.name.localeCompare(b.provider.name));
  }

  function assignmentQueueItems() {
    return state.orders.map((order) => {
      const stage = assignmentStage(order);
      if (!stage) return null;
      const assignment = order.assignment?.stage === stage ? order.assignment : null;
      if (assignment?.status === 'ACCEPTED') return null;
      const status = assignment?.status === 'OFFERED' ? 'OFFERED' : assignment?.status === 'DECLINED' || assignment?.status === 'TIMED_OUT' ? 'REMATCH' : 'AVAILABLE';
      const matches = status === 'OFFERED' ? 1 : assignmentCandidates(order, stage).filter((candidate) => candidate.eligible).length;
      return { order, stage, assignment, status, matches };
    }).filter(Boolean);
  }

  function filteredAssignmentQueue() {
    const query = assignmentSearch.trim().toLowerCase();
    return assignmentQueueItems().filter((item) => {
      if (assignmentFilter === 'available' && item.status !== 'AVAILABLE' && item.status !== 'REMATCH') return false;
      if (assignmentFilter === 'offered' && item.status !== 'OFFERED') return false;
      if (assignmentFilter === 'rider' && item.stage !== 'rider') return false;
      if (assignmentFilter === 'vendor' && item.stage !== 'vendor') return false;
      return !query || [item.order.id, item.order.customer, item.order.service, item.order.area, item.order.provider, item.order.rider].join(' ').toLowerCase().includes(query);
    });
  }

  function renderAssignmentRows() {
    return filteredAssignmentQueue().map((item) => {
      const { order, stage, assignment, status, matches } = item;
      const statusText = status === 'OFFERED' ? `Offer sent · ${assignment.providerName}` : status === 'REMATCH' ? 'Re-match required' : matches ? `${matches} eligible` : 'No eligible providers';
      const badge = status === 'OFFERED' ? 'blue' : status === 'REMATCH' ? 'orange' : matches ? 'green' : 'amber';
      const actionText = status === 'OFFERED' ? 'Manage offer' : 'Find match';
      return `<tr>
        <td><div class="table-person"><span class="table-avatar">${icon(order.workflow === 'vendor' ? 'store' : 'bike')}</span><span><strong>${escapeHTML(order.id)}</strong><small>${escapeHTML(order.service)} · ${escapeHTML(order.customer)}</small></span></div></td>
        <td><span class="match-stage-label">${escapeHTML(assignmentStageLabel(order, stage))}</span><small class="match-stage-sub">${escapeHTML(order.workflow === 'vendor' ? 'Vendor pathway' : 'Errand pathway')}</small></td>
        <td><span class="basis-label">${escapeHTML(order.area)}</span></td>
        <td><span class="badge badge-${badge}">${escapeHTML(statusText)}</span></td>
        <td><span class="scope-label">${status === 'OFFERED' ? 'Awaiting simulated response' : status === 'REMATCH' ? 'Previous offer closed' : 'Review eligibility'}</span></td>
        <td><button class="button button-secondary order-open-button" type="button" data-action="open-assignment" data-id="${escapeAttr(order.id)}">${actionText} ${icon('arrow-right')}</button></td>
      </tr>`;
    }).join('');
  }

  function renderAssignmentQueuePage() {
    const items = assignmentQueueItems();
    const openOffers = items.filter((item) => item.status === 'OFFERED').length;
    const needsMatch = items.length - openOffers;
    const eligibleCount = items.filter((item) => item.status !== 'OFFERED').reduce((sum, item) => sum + assignmentCandidates(item.order, item.stage).filter((candidate) => candidate.eligible).length, 0);
    const noMatchCount = items.filter((item) => item.status !== 'OFFERED' && item.matches === 0).length;
    const stats = [
      ['Needs assignment', String(needsMatch), 'Errands, vendors and pickup riders', 'clipboard', 'amber'],
      ['Offers awaiting response', String(openOffers), 'Not accepted until simulated', 'clock', 'blue'],
      ['Eligible match options', String(eligibleCount), 'After policy checks', 'users', 'green'],
      ['No eligible match', String(noMatchCount), 'Check coverage or readiness', 'shield', 'orange']
    ];
    const available = items.filter((item) => item.status !== 'OFFERED').length;
    const filters = [
      ['all', 'All', items.length], ['available', 'Needs match', available], ['offered', 'Offer pending', openOffers],
      ['rider', 'Rider jobs', items.filter((item) => item.stage === 'rider').length], ['vendor', 'Vendor selection', items.filter((item) => item.stage === 'vendor').length]
    ];
    const buttons = `<button class="button button-secondary" type="button" data-action="module-help">${icon('info')}<span>Matching safeguards</span></button><button class="button button-secondary" type="button" data-action="add-test-order">${icon('plus')}<span>Test errand</span></button><button class="button button-primary" type="button" data-action="add-test-vendor-order">${icon('plus')}<span>Test vendor order</span></button>`;
    const rows = renderAssignmentRows();
    return `<div class="page assignment-page">
      ${renderPageHeading('Assignment queue', 'WORKSPACE / LOCATION-AWARE MATCHING', 'Match each request to an approved, online provider with the right service capability, available capacity and configured pickup coverage. Offers and responses are simulated locally.', buttons)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>Match the right partner—not just the nearest name.</h2><p>Errands go to rider candidates; restaurant and small-chops orders go to their own vendor types. Vendor pickup jobs enter the rider queue only when ready.</p></div><span class="module-hero-badge">${icon('map')}Coverage + approval + availability</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">Requests needing a provider</h2><p class="card-subtitle">A sent offer remains pending until a simulated response moves the order workflow.</p></div><span class="badge badge-blue">${items.length} queue item${items.length === 1 ? '' : 's'}</span></div>
        <div class="assignment-toolbar"><div class="rule-filters assignment-filters" role="group" aria-label="Filter assignment requests">${filters.map(([key, label, count]) => `<button class="filter-button ${assignmentFilter === key ? 'active' : ''}" type="button" data-assignment-filter="${escapeAttr(key)}">${escapeHTML(label)} <span>${count}</span></button>`).join('')}</div><label class="search-field"><span class="sr-only">Search assignment requests</span>${icon('search')}<input id="assignmentSearch" type="search" placeholder="Search order, customer or location…" value="${escapeAttr(assignmentSearch)}"></label></div>
        <div class="table-scroll"><table class="module-table assignment-table"><thead><tr><th>Order / customer</th><th>Assignment stage</th><th>Pickup area</th><th>Match status</th><th>Response</th><th>Action</th></tr></thead><tbody id="assignmentTableBody">${rows || '<tr><td colspan="6"><div class="empty-state">No matching assignments in this view.</div></td></tr>'}</tbody></table></div>
        <div class="table-foot"><span id="assignmentCountFoot">Showing <strong>${filteredAssignmentQueue().length}</strong> of ${items.length} requests needing an assignment</span><span>Sample providers · browser-only offers</span></div>
      </section>
      <div class="rule-note">${icon('shield')}<span><strong>Eligibility is a demo policy check.</strong> Production dispatch must verify current partner approval, rider/company scope, service-area geometry, live availability, capacity and offer expiry on the server before sending notifications.</span></div>
    </div>`;
  }

  function assignmentEvent(order, stage, title, provider = null, note = '') {
    const at = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    order.assignmentHistory = Array.isArray(order.assignmentHistory) ? order.assignmentHistory : [];
    order.assignmentHistory.push({ stage, title, providerId: provider?.id || '', providerName: provider?.name || 'Unassigned', actor: 'Dispatch Manager (demo)', at, note });
    order.assignmentHistory = order.assignmentHistory.slice(-30);
    return at;
  }

  function renderAssignmentModal(orderId) {
    const item = assignmentQueueItems().find((entry) => entry.order.id === orderId);
    if (!item) return;
    const { order, stage, assignment, status } = item;
    const offered = status === 'OFFERED';
    const candidate = offered ? state.providers.find((provider) => provider.id === assignment.providerId) : null;
    const candidates = offered ? [] : assignmentCandidates(order, stage);
    const candidateRows = candidates.map((result) => {
      const provider = result.provider;
      const detail = [provider.company, provider.vehicle, `${result.load}/${provider.capacity} active jobs`].filter(Boolean).join(' · ');
      const statusCopy = result.eligible ? 'Eligible for this request' : result.reasons.join(' · ');
      return `<article class="candidate-card ${result.eligible ? 'candidate-eligible' : 'candidate-ineligible'}"><div class="candidate-main"><span class="candidate-avatar">${escapeHTML(initials(provider.name))}</span><div class="candidate-copy"><strong>${escapeHTML(provider.name)}</strong><small>${escapeHTML(provider.label)}${provider.company ? ` · ${escapeHTML(provider.company)}` : ''}</small><small>${escapeHTML(detail)}${provider.rating !== '—' ? ` · ${escapeHTML(provider.rating)}★` : ''}</small></div><span class="badge badge-${result.eligible ? 'green' : 'gray'}">${result.eligible ? 'Eligible' : 'Not eligible'}</span></div><div class="candidate-reason">${escapeHTML(statusCopy)}</div><div class="candidate-actions"><span class="candidate-coverage">${icon('pin')}${escapeHTML(provider.coverage.map((scope) => `${scope.lga}, ${scope.state}`).join(' · '))}</span><button class="button ${result.eligible ? 'button-primary' : 'button-secondary'} order-open-button" type="button" data-action="send-assignment-offer" data-id="${escapeAttr(order.id)}" data-provider-id="${escapeAttr(provider.id)}" ${result.eligible ? '' : 'disabled'}>${icon(result.eligible ? 'arrow-right' : 'lock')}<span>${result.eligible ? 'Send demo offer' : 'Unavailable'}</span></button></div></article>`;
    }).join('');
    const history = (order.assignmentHistory || []).filter((event) => event.stage === stage).slice().reverse().map((event) => `<div class="assignment-event"><span class="application-event-dot"></span><div><strong>${escapeHTML(event.title)}</strong><small>${escapeHTML(event.providerName)} · ${escapeHTML(event.actor)} · ${escapeHTML(event.at)}</small>${event.note ? `<p>${escapeHTML(event.note)}</p>` : ''}</div></div>`).join('');
    const responseActions = offered ? `<button class="button button-secondary" type="button" data-action="assignment-response" data-id="${escapeAttr(order.id)}" data-response="timeout">Simulate timeout</button><button class="button button-primary" type="button" data-action="assignment-response" data-id="${escapeAttr(order.id)}" data-response="accept">Simulate acceptance</button>` : '';
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal assignment-modal" role="dialog" aria-modal="true" aria-labelledby="assignmentModalTitle">
      <header class="modal-header"><div><div class="eyebrow">${escapeHTML(order.id)} <span class="eyebrow-separator">/</span> ${escapeHTML(order.workflow === 'vendor' ? 'VENDOR PATH' : 'ERRAND PATH')}</div><h2 id="assignmentModalTitle">${escapeHTML(assignmentStageLabel(order, stage))}</h2><p>${escapeHTML(order.customer)} · ${escapeHTML(order.service)} · ${escapeHTML(order.area)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="modal-body"><div class="assignment-order-summary"><div><span class="field-label">REQUEST TOTAL</span><strong>${formatNaira(order.total)}</strong></div><div><span class="field-label">CURRENT STATUS</span><strong>${escapeHTML(status === 'OFFERED' ? 'Offer awaiting response' : status === 'REMATCH' ? 'Previous offer closed' : 'Unassigned')}</strong></div></div>
        ${offered && candidate ? `<div class="active-offer-card"><div><strong>Demo offer sent to ${escapeHTML(candidate.name)}</strong><p>${escapeHTML(candidate.label)}${candidate.company ? ` · ${escapeHTML(candidate.company)}` : ''} · ${escapeHTML(assignment.at || '')}</p></div><span class="badge badge-blue">Awaiting response</span></div><p class="assignment-disclaimer">Sending an offer is not acceptance. Current approval, availability, coverage and capacity are checked again on response; no notification was sent.</p>` : `<section class="assignment-candidate-section"><div class="review-section-heading"><div><h3>Eligible provider candidates</h3><p>Checked against current demo approval, company status, service, availability, capacity and saved coverage.</p></div><span class="badge badge-green">${candidates.filter((result) => result.eligible).length} eligible</span></div><div class="candidate-list">${candidateRows || '<div class="coverage-empty">No candidate records match this provider type.</div>'}</div></section>${status === 'REMATCH' ? '<p class="assignment-disclaimer">The previous offer closed. Choose an eligible provider to re-match this request.</p>' : ''}`}
        <section class="review-section assignment-history-section"><div class="review-section-heading"><div><h3>Offer history</h3><p>Local dispatch events for this assignment stage.</p></div></div><div class="assignment-event-list">${history || '<p class="field-help">No offers have been sent for this stage.</p>'}</div></section>
      </div><footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Simulation only · No push/SMS sent</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button>${responseActions}</div></footer>
    </section></div>`;
  }

  function sendAssignmentOffer(orderId, providerId) {
    const item = assignmentQueueItems().find((entry) => entry.order.id === orderId);
    if (!item || item.status === 'OFFERED') return;
    const result = assignmentCandidates(item.order, item.stage).find((candidate) => candidate.provider.id === providerId);
    if (!result || !result.eligible) { toast('This provider no longer meets the current demo matching rules.'); return; }
    const order = item.order;
    const provider = result.provider;
    const at = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    order.assignment = { stage: item.stage, providerId: provider.id, providerName: provider.name, status: 'OFFERED', at, respondedAt: '' };
    if (item.stage === 'vendor') {
      order.provider = provider.name;
      order.rider = 'Pending vendor acceptance';
    } else if (order.workflow === 'vendor') {
      order.rider = provider.name;
    } else {
      order.provider = provider.company ? `${provider.company} fleet` : 'Individual rider';
      order.rider = provider.name;
    }
    assignmentEvent(order, item.stage, 'Demo offer sent', provider, 'Awaiting a simulated partner response.');
    saveState();
    render();
    renderAssignmentModal(orderId);
    toast(`Demo offer sent to ${provider.name}. It is not accepted until a response is simulated.`);
  }

  function returnAssignmentToQueue(order, stage) {
    if (stage === 'vendor') {
      order.provider = 'Awaiting eligible vendor';
      order.rider = 'Pending vendor acceptance';
    } else if (order.workflow === 'vendor') {
      order.rider = 'Pending rider assignment';
    } else {
      order.provider = 'Awaiting eligible rider';
      order.rider = 'Unassigned';
    }
  }

  function respondToAssignment(orderId, response) {
    const order = state.orders.find((item) => item.id === orderId);
    const assignment = order?.assignment;
    if (!order || !assignment || assignment.status !== 'OFFERED' || !['accept', 'timeout'].includes(response)) return;
    const provider = state.providers.find((item) => item.id === assignment.providerId);
    if (!provider) return;
    assignment.respondedAt = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    if (response === 'accept') {
      const eligibility = providerEligibility(provider, order, assignment.stage, order.id);
      if (!eligibility.eligible) {
        assignment.status = 'DECLINED';
        assignmentEvent(order, assignment.stage, 'Offer invalidated (eligibility changed)', provider, eligibility.reasons.join(' · '));
        returnAssignmentToQueue(order, assignment.stage);
        saveState();
        render();
        renderAssignmentModal(orderId);
        toast('Provider eligibility changed before acceptance; the request has returned to the matching queue.');
        return;
      }
      assignment.status = 'ACCEPTED';
      assignmentEvent(order, assignment.stage, 'Offer accepted (simulated)', provider, 'Acceptance is simulated locally.');
      if (order.state === 'REQUESTED') {
        const nextState = assignment.stage === 'vendor' ? 'VENDOR_ACCEPTED' : 'PROVIDER_ACCEPTED';
        transitionOrder(orderId, nextState);
        return;
      }
      saveState();
      render();
      closeModal();
      toast(`${provider.name} accepted the simulated rider offer.`);
      return;
    }
    assignment.status = 'TIMED_OUT';
    assignmentEvent(order, assignment.stage, 'Offer timed out (simulated)', provider, 'Request returned to the matching queue.');
    returnAssignmentToQueue(order, assignment.stage);
    saveState();
    render();
    renderAssignmentModal(orderId);
    toast('Offer timed out in the demo; the request is available for re-matching.');
  }

  function testOrderArea() {
    const selected = selectedLocation;
    if (selected === 'All locations') {
      const fallbackState = state.coverage.find((item) => item.lgas.length) || state.coverage[0];
      return fallbackState?.lgas[0] ? `${fallbackState.lgas[0].name} · ${fallbackState.name}` : (fallbackState?.name || 'Kano State');
    }
    const parsed = parseAssignmentLocation(selected);
    const resolved = resolveConfiguredLocation(selected);
    if (resolved && parsed.place) return `${parsed.place} · ${resolved.state.name}`;
    if (resolved && parsed.state && !parsed.place) return resolved.state.lgas[0] ? `${resolved.state.lgas[0].name} · ${resolved.state.name}` : resolved.state.name;
    if (resolved?.lga) return `${resolved.lga.name} · ${resolved.state.name}`;
    return selected || 'Kano Municipal · Kano State';
  }

  function addTestVendorOrder() {
    const suffix = `${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
    const at = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    const order = {
      id: `EX-V${suffix}`, workflow: 'vendor', state: 'REQUESTED', service: 'Restaurant order', customer: 'Demo customer',
      provider: 'Awaiting eligible vendor', rider: 'Pending vendor acceptance', area: testOrderArea(), total: 4600, created: at,
      history: [{ state: 'REQUESTED', actor: 'Customer (simulated)', at }]
    };
    state.orders.unshift(order);
    saveState();
    render();
    renderAssignmentModal(order.id);
    toast('Vendor test order added to the local matching queue.');
  }

  function orderLedgerEntries(orderId) {
    return state.ledgerEntries.filter((entry) => entry.orderId === orderId);
  }

  function orderEarningTargets(order) {
    if (!order) return [];
    const targets = [];
    if (order.workflow === 'vendor') {
      const vendor = state.providers.find((provider) => provider.name === order.provider && ['restaurant', 'small_chops'].includes(provider.type));
      if (vendor) targets.push({ provider: vendor, role: 'vendor', service: vendor.type === 'small_chops' ? 'Small-chops orders' : 'Restaurant orders' });
    }
    const rider = state.providers.find((provider) => provider.name === order.rider && ['individual_rider', 'company_rider'].includes(provider.type));
    if (rider) {
      const service = rider.type === 'company_rider' ? 'Company dispatch' : /food/i.test(order.service) || order.workflow === 'vendor' ? 'Food delivery' : 'Errands';
      targets.push({ provider: rider, role: 'rider', service });
    }
    return targets;
  }

  function missingOrderEarningTargets(order) {
    return orderEarningTargets(order).filter((target) => !state.ledgerEntries.some((entry) => entry.orderId === order.id && entry.providerId === target.provider.id));
  }

  function activeEarningRulesForTarget(target) {
    const ruleType = target.provider.type === 'individual_rider' ? 'individual' : target.provider.type;
    return state.rules.filter((rule) => rule && rule.active === true && rule.type === ruleType && Array.isArray(rule.services) && rule.services.includes(target.service) && ['percentage', 'fixed', 'per_request'].includes(rule.model) && Object.prototype.hasOwnProperty.call(BASIS_LABELS, rule.basis));
  }

  function renderOrderEarningLine(target, order) {
    const orderEarningTotalLimit = Math.max(0, Number(order.total) || 0);
    const rules = activeEarningRulesForTarget(target);
    if (!rules.length) {
      return `<section class="settlement-target-card settlement-target-unavailable"><div class="settlement-target-heading"><div><span class="field-label">${escapeHTML(target.role === 'vendor' ? 'VENDOR EARNING' : 'RIDER EARNING')}</span><h3>${escapeHTML(target.provider.name)}</h3><small>${escapeHTML(target.provider.label)} · ${escapeHTML(target.service)}</small></div><span class="badge badge-amber">No active rule</span></div><p>No active earning rule covers this provider and service. Add or activate a matching rule before recording this line.</p><button class="button button-secondary" type="button" data-page="earnings">Manage earning rules</button></section>`;
    }
    const providerId = target.provider.id;
    const options = rules.map((rule) => `<option value="${escapeAttr(rule.id)}">${escapeHTML(ruleTitle(rule))} · ${escapeHTML(rule.scope || 'Custom scope')} · ${escapeHTML(modeRateText(rule))}</option>`).join('');
    const selectedRule = rules[0];
    return `<section class="settlement-target-card" data-settlement-line data-provider-id="${escapeAttr(providerId)}">
      <div class="settlement-target-heading"><div><span class="field-label">${escapeHTML(target.role === 'vendor' ? 'VENDOR EARNING' : 'RIDER EARNING')}</span><h3>${escapeHTML(target.provider.name)}</h3><small>${escapeHTML(target.provider.label)}${target.provider.company ? ` · ${escapeHTML(target.provider.company)}` : ''} · ${escapeHTML(target.service)}</small></div><span class="badge badge-blue">${escapeHTML(BENEFICIARIES.find((item) => item.type === (target.provider.type === 'individual_rider' ? 'individual' : target.provider.type))?.label || target.provider.label)}</span></div>
      <div class="settlement-fields-grid">
        <label class="form-field"><span class="field-label">Applicable active rule</span><select class="select-control" data-settlement-rule>${options}</select><small class="field-help">Choose the scope that applies to this completed demo order.</small></label>
        <label class="form-field"><span class="field-label">Eligible calculation base</span><small class="settlement-basis-label" data-settlement-basis>${escapeHTML(BASIS_LABELS[selectedRule.basis])}</small><div class="input-with-prefix"><span>₦</span><input class="input-control" data-settlement-base type="number" min="1" max="${escapeAttr(orderEarningTotalLimit)}" step="1" placeholder="Enter illustrative base" inputmode="numeric"></div><small class="field-help">Enter a demo base for this rule. It must not exceed the order total of ${formatNaira(orderEarningTotalLimit)}.</small></label>
        <label class="form-field settlement-manual-field" data-settlement-manual-wrap hidden><span class="field-label">Amount set for this request</span><div class="input-with-prefix"><span>₦</span><input class="input-control" data-settlement-manual type="number" min="0" max="${escapeAttr(orderEarningTotalLimit)}" step="1" placeholder="Enter this order’s payout" inputmode="numeric"></div><small class="field-help">This amount is entered for this order only; no default is stored in the rule.</small></label>
      </div>
      <div class="settlement-preview" data-settlement-preview role="status" aria-live="polite">Enter the eligible base to preview this rule.</div>
    </section>`;
  }

  function renderOrderEarningsModal(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || order.state !== 'COMPLETED') { toast('Calculate demo earnings only after the order reaches Completed.'); return; }
    const existing = orderLedgerEntries(order.id);
    const missingTargets = missingOrderEarningTargets(order);
    const targetSections = missingTargets.map((target) => renderOrderEarningLine(target, order)).join('');
    const existingEntries = existing.map((entry) => `<div class="settlement-existing-row"><span>${escapeHTML(entry.beneficiaryName)} · ${escapeHTML(entry.orderId)}</span><strong>${formatNaira(entry.amount)}</strong><small>${escapeHTML(entry.ruleName)} · ${escapeHTML(MODE_SHORT[entry.model] || entry.model)} · Pending settlement</small></div>`).join('');
    let emptyMessage = '';
    if (!missingTargets.length && !existing.length) emptyMessage = '<div class="settlement-empty">No linked sample provider profile could be matched to this completed order. No earning line was created.</div>';
    else if (!missingTargets.length) emptyMessage = '<div class="settlement-empty">All matched provider earning lines for this order are already recorded. Existing ledger snapshots will not change if a rule is edited later.</div>';
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal order-earnings-modal" role="dialog" aria-modal="true" aria-labelledby="orderEarningsTitle" data-order-id="${escapeAttr(order.id)}">
      <header class="modal-header"><div><div class="eyebrow">${escapeHTML(order.id)} <span class="eyebrow-separator">/</span> COMPLETED ORDER</div><h2 id="orderEarningsTitle">Calculate mock earnings</h2><p>${escapeHTML(order.customer)} · ${escapeHTML(order.service)} · ${formatNaira(order.total)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="modal-body"><div class="settlement-disclaimer">${icon('info')}<span>Browser-only calculation. Enter the eligible base for each selected rule; this prototype does not infer fees, item subtotals or fleet allocations from the order total. New lines stay pending settlement. No money moves.</span></div>
        ${existingEntries ? `<section class="settlement-existing"><div class="review-section-heading"><div><h3>Already recorded for this order</h3><p>Rule and amount snapshots are preserved.</p></div></div>${existingEntries}</section>` : ''}
        ${targetSections ? `<div class="settlement-target-list">${targetSections}</div>` : emptyMessage}
      </div><footer class="modal-footer"><span class="modal-footer-note">${icon('lock')}Pending settlement only · no transfer</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button>${missingTargets.some((target) => activeEarningRulesForTarget(target).length) ? `<button class="button button-primary" type="button" data-action="save-order-earnings">${icon('check')}<span>Record demo ledger entries</span></button>` : ''}</div></footer>
    </section></div>`;
    document.querySelectorAll('[data-settlement-line]').forEach((section) => {
      const update = () => updateOrderEarningPreview(section);
      section.querySelector('[data-settlement-rule]')?.addEventListener('change', update);
      section.querySelector('[data-settlement-base]')?.addEventListener('input', update);
      section.querySelector('[data-settlement-manual]')?.addEventListener('input', update);
      update();
    });
  }

  function updateOrderEarningPreview(section) {
    const providerId = section.dataset.providerId;
    const dialog = document.querySelector('.order-earnings-modal');
    const order = state.orders.find((item) => item.id === dialog?.dataset.orderId);
    const target = orderEarningTargets(order).find((item) => item.provider.id === providerId);
    const ruleId = section.querySelector('[data-settlement-rule]')?.value;
    const rule = target && activeEarningRulesForTarget(target).find((item) => item.id === ruleId);
    const baseInput = section.querySelector('[data-settlement-base]');
    const manualInput = section.querySelector('[data-settlement-manual]');
    const manualWrap = section.querySelector('[data-settlement-manual-wrap]');
    const basisLabel = section.querySelector('[data-settlement-basis]');
    const preview = section.querySelector('[data-settlement-preview]');
    if (!rule || !baseInput || !preview) return;
    if (basisLabel) basisLabel.textContent = BASIS_LABELS[rule.basis];
    if (manualWrap) manualWrap.hidden = rule.model !== 'per_request';
    if (baseInput) baseInput.max = String(Math.max(0, Number(order?.total) || 0));
    if (manualInput) manualInput.max = String(Math.max(0, Number(order?.total) || 0));
    const baseRaw = baseInput.value.trim();
    if (!baseRaw) {
      preview.className = 'settlement-preview';
      preview.innerHTML = `Enter the eligible ${escapeHTML(BASIS_LABELS[rule.basis].toLowerCase())} base to preview this rule.`;
      return;
    }
    const base = Number(baseRaw);
    if (!Number.isInteger(base) || base <= 0 || base > (Number(order?.total) || 0)) {
      preview.className = 'settlement-preview settlement-preview-error';
      preview.textContent = 'Enter a whole-naira eligible base no greater than this order total.';
      return;
    }
    let payout = 0;
    if (rule.model === 'percentage') {
      const rate = Number(rule.rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        preview.className = 'settlement-preview settlement-preview-error';
        preview.textContent = 'This saved percentage rule is invalid; edit it before calculating earnings.';
        return;
      }
      payout = Math.round(base * rate / 100);
    } else if (rule.model === 'fixed') {
      const amount = Number(rule.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        preview.className = 'settlement-preview settlement-preview-error';
        preview.textContent = 'This saved fixed-amount rule is invalid; edit it before calculating earnings.';
        return;
      }
      payout = Math.round(amount);
    } else {
      const manualRaw = manualInput?.value.trim() || '';
      if (!manualRaw) {
        preview.className = 'settlement-preview';
        preview.textContent = 'Enter the amount set for this request to preview the payout.';
        return;
      }
      const manual = Number(manualRaw);
      if (!Number.isInteger(manual) || manual < 0 || manual > (Number(order?.total) || 0)) {
        preview.className = 'settlement-preview settlement-preview-error';
        preview.textContent = 'Enter a valid request amount no greater than this order total.';
        return;
      }
      payout = Math.round(manual);
    }
    if (payout > base) {
      preview.className = 'settlement-preview settlement-preview-error';
      preview.textContent = `Calculated payout ${formatNaira(payout)} exceeds the eligible base ${formatNaira(base)}.`;
      return;
    }
    preview.className = 'settlement-preview';
    preview.innerHTML = `<span>${escapeHTML(ruleTitle(rule))} · ${escapeHTML(MODE_SHORT[rule.model] || rule.model)}</span><strong>${formatNaira(payout)}</strong><small>${formatNaira(base)} ${escapeHTML(BASIS_LABELS[rule.basis].toLowerCase())} base · ${formatNaira(base - payout)} remains before other fees.</small>`;
  }

  function createLedgerEntryId() {
    return `LG-D${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function saveOrderEarnings() {
    const dialog = document.querySelector('.order-earnings-modal');
    const order = state.orders.find((item) => item.id === dialog?.dataset.orderId);
    if (!order || order.state !== 'COMPLETED') { toast('The order must remain completed to record a demo earning.'); return; }
    const targets = missingOrderEarningTargets(order);
    const lines = [];
    for (const target of targets) {
      const section = [...document.querySelectorAll('[data-settlement-line]')].find((item) => item.dataset.providerId === target.provider.id);
      if (!section) continue;
      const ruleId = section.querySelector('[data-settlement-rule]')?.value;
      const rule = activeEarningRulesForTarget(target).find((item) => item.id === ruleId);
      const baseRaw = section.querySelector('[data-settlement-base]')?.value.trim() || '';
      const base = Number(baseRaw);
      if (!rule || !baseRaw || !Number.isInteger(base) || base <= 0 || base > Number(order.total)) {
        toast(`Enter a valid eligible base and active rule for ${target.provider.name}.`);
        return;
      }
      let payout = 0;
      if (rule.model === 'percentage') {
        const rate = Number(rule.rate);
        if (!Number.isFinite(rate) || rate < 0 || rate > 100) { toast('Correct the selected percentage rule before calculating.'); return; }
        payout = Math.round(base * rate / 100);
      } else if (rule.model === 'fixed') {
        const amount = Number(rule.amount);
        if (!Number.isFinite(amount) || amount < 0) { toast('Correct the selected fixed amount before calculating.'); return; }
        payout = Math.round(amount);
      } else {
        const manualRaw = section.querySelector('[data-settlement-manual]')?.value.trim() || '';
        const manual = Number(manualRaw);
        if (!manualRaw || !Number.isInteger(manual) || manual < 0 || manual > Number(order.total)) { toast(`Enter a valid per-request amount for ${target.provider.name}.`); return; }
        payout = Math.round(manual);
      }
      if (payout > base) { toast(`The payout for ${target.provider.name} cannot exceed its eligible base.`); return; }
      lines.push({ target, rule, base: Math.round(base), payout });
    }
    if (!lines.length) { toast('No eligible earning lines are ready to record.'); return; }
    const createdAt = new Date().toISOString();
    const entries = lines.map(({ target, rule, base, payout }) => ({
      id: createLedgerEntryId(), orderId: order.id, providerId: target.provider.id, beneficiaryName: target.provider.name,
      beneficiaryType: target.provider.type, role: target.role, ruleId: rule.id, ruleName: ruleTitle(rule), ruleScope: rule.scope || '',
      model: rule.model, rate: rule.model === 'percentage' ? Number(rule.rate) : 0, fixedAmount: rule.model === 'fixed' ? Number(rule.amount) : 0,
      basis: rule.basis, basisAmount: base, amount: payout, status: 'PENDING_SETTLEMENT', createdAt
    }));
    state.ledgerEntries = [...entries, ...state.ledgerEntries];
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    addActivity('Order-linked demo earnings calculated', `${order.id} · ${entries.length} provider line${entries.length === 1 ? '' : 's'}`, formatNaira(total));
    saveState();
    closeModal();
    render();
    renderOrderModal(order.id);
    toast(`${entries.length} mock earning line${entries.length === 1 ? '' : 's'} recorded as pending settlement.`);
  }

  function renderLedgerEntryModal(entryId) {
    const entry = state.ledgerEntries.find((item) => item.id === entryId);
    if (!entry) return;
    const order = state.orders.find((item) => item.id === entry.orderId);
    const method = entry.model === 'percentage' ? `${entry.rate}% of eligible base` : entry.model === 'fixed' ? `${formatNaira(entry.fixedAmount)} per completed order` : 'Amount set for this request';
    const recordedAt = entry.createdAt ? new Date(entry.createdAt) : null;
    const time = recordedAt && !Number.isNaN(recordedAt.getTime()) ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(recordedAt) : 'Recorded locally';
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal ledger-entry-modal" role="dialog" aria-modal="true" aria-labelledby="ledgerEntryTitle"><header class="modal-header"><div><div class="eyebrow">${escapeHTML(entry.id)} <span class="eyebrow-separator">/</span> ${escapeHTML(entry.orderId)}</div><h2 id="ledgerEntryTitle">Order-linked earning</h2><p>${escapeHTML(entry.beneficiaryName)} · ${escapeHTML(BENEFICIARIES.find((item) => item.type === (entry.beneficiaryType === 'individual_rider' ? 'individual' : entry.beneficiaryType))?.label || entry.beneficiaryType)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><div class="modal-body"><div class="settlement-disclaimer">${icon('info')}<span>Browser-only ledger snapshot. This line is pending settlement; no transfer or withdrawal occurred.</span></div><dl class="ledger-entry-details"><div><dt>Selected rule</dt><dd>${escapeHTML(entry.ruleName)}${entry.ruleScope ? ` · ${escapeHTML(entry.ruleScope)}` : ''}</dd></div><div><dt>Method</dt><dd>${escapeHTML(method)}</dd></div><div><dt>Calculation base</dt><dd>${escapeHTML(BASIS_LABELS[entry.basis] || entry.basis)} · ${formatNaira(entry.basisAmount)}</dd></div><div><dt>Calculated earning</dt><dd>${formatNaira(entry.amount)}</dd></div><div><dt>Order total</dt><dd>${formatNaira(order?.total || 0)}</dd></div><div><dt>Status / recorded</dt><dd>Pending settlement · ${escapeHTML(time)}</dd></div></dl></div><footer class="modal-footer"><span class="modal-footer-note">${icon('lock')}No money moved</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button>${order ? `<button class="button button-primary" type="button" data-action="open-order" data-id="${escapeAttr(order.id)}">View order</button>` : ''}</div></footer></section></div>`;
  }

  function renderOrderModal(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return;
    const path = ORDER_STEPS[order.workflow] || ORDER_STEPS.errand;
    const currentIndex = path.indexOf(order.state);
    const nextState = orderNextState(order);
    const history = Array.isArray(order.history) ? order.history : [];
    const steps = path.map((stage, index) => {
      const event = history.find((entry) => entry.state === stage);
      const status = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending';
      const marker = status === 'done' ? icon('check') : String(index + 1);
      const eventCopy = event ? `${escapeHTML(event.at || '')}${event.at ? ' · ' : ''}${escapeHTML(event.actor || 'Recorded')}` : status === 'pending' ? 'Not reached' : 'In progress';
      return `<li class="flow-step ${status}"><span class="flow-marker">${marker}</span><span class="flow-step-copy"><strong>${escapeHTML(ORDER_STATE_LABELS[stage] || stage)}</strong><small>${eventCopy}</small></span></li>`;
    }).join('');
    const latest = history[history.length - 1];
    const nextButton = nextState
      ? `<button class="button button-primary" type="button" data-action="transition-order" data-id="${escapeAttr(order.id)}" data-next="${escapeAttr(nextState)}">${icon('arrow-right')}<span>${escapeHTML(ORDER_NEXT_ACTIONS[nextState] || ORDER_STATE_LABELS[nextState])}</span></button>`
      : `<span class="badge badge-green">${icon('check')}Workflow complete</span>`;
    const recordedEarnings = orderLedgerEntries(order.id);
    const missingEarningTargets = order.state === 'COMPLETED' ? missingOrderEarningTargets(order) : [];
    const settlementCopy = order.state === 'COMPLETED'
      ? recordedEarnings.length ? `${recordedEarnings.length} browser-only earning line${recordedEarnings.length === 1 ? '' : 's'} recorded; all remain pending settlement. No money moved.` : orderEarningTargets(order).length ? 'Order completed. Calculate mock earnings from the active rules; new ledger lines remain pending settlement.' : 'No linked sample provider profile was found for this order, so no earning line can be calculated.'
      : 'Partner earnings remain unavailable until completion and payment reconciliation.';
    const earningsAction = order.state !== 'COMPLETED' ? '' : missingEarningTargets.length
      ? `<button class="button button-primary" type="button" data-action="calculate-order-earnings" data-id="${escapeAttr(order.id)}">${icon('chart')}<span>${recordedEarnings.length ? 'Add missing earning lines' : 'Calculate demo earnings'}</span></button>`
      : recordedEarnings.length ? `<button class="button button-secondary" type="button" data-page="ledger">${icon('receipt')}<span>View ledger</span></button>` : '';
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal order-modal" role="dialog" aria-modal="true" aria-labelledby="orderModalTitle">
      <header class="modal-header"><div><div class="eyebrow">${escapeHTML(order.id)} <span class="eyebrow-separator">/</span> ${escapeHTML(order.service)}</div><h2 id="orderModalTitle">Order workflow</h2><p>${escapeHTML(order.customer)} · ${escapeHTML(order.area)} · ${formatNaira(order.total)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="modal-body">
        <div class="order-current-state"><div><span class="field-label">CURRENT STATE</span><strong>${escapeHTML(ORDER_STATE_LABELS[order.state] || order.state)}</strong><small>${escapeHTML(order.provider)}${order.rider && order.rider !== 'Unassigned' ? ` · ${escapeHTML(order.rider)}` : ''}</small></div><span class="badge badge-${orderBadgeColor(order.state)}">${escapeHTML(order.workflow === 'vendor' ? 'Vendor order' : 'Errand')}</span></div>
        <div class="order-timeline-wrap"><div class="timeline-heading"><h3>Allowed progression</h3><span>${history.length} event${history.length === 1 ? '' : 's'} recorded locally</span></div><ol class="order-timeline">${steps}</ol></div>
        <div class="order-settlement-note">${icon('wallet')}<span><strong>Settlement guard</strong>${escapeHTML(settlementCopy)}</span></div>
        ${latest ? `<p class="order-last-event">Last event: ${escapeHTML(ORDER_STATE_LABELS[latest.state] || latest.state)} · ${escapeHTML(latest.actor || 'Recorded')} · ${escapeHTML(latest.at || '')}</p>` : ''}
      </div>
      <footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Local simulation · No credentials or payments are verified</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button>${nextButton}${earningsAction}</div></footer>
    </section></div>`;
  }

  function transitionOrder(orderId, requestedState) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || orderNextState(order) !== requestedState) {
      toast('That order transition is not allowed from the current state.');
      return;
    }
    order.state = requestedState;
    if (requestedState === 'VENDOR_ACCEPTED' && /^Awaiting/.test(order.provider)) order.provider = 'Eligible vendor (simulated)';
    if (requestedState === 'VENDOR_ACCEPTED' && ['Pending vendor acceptance', 'Unassigned'].includes(order.rider)) order.rider = 'Pending rider assignment';
    const actor = requestedState === 'PAYMENT_VERIFIED' ? 'Payment service (simulated)' :
      requestedState === 'VENDOR_ACCEPTED' || requestedState === 'PREPARING' || requestedState === 'READY_FOR_PICKUP' ? order.provider :
      requestedState === 'PROVIDER_ACCEPTED' ? (order.rider && order.rider !== 'Unassigned' ? order.rider : 'Eligible provider (simulated)') :
      requestedState === 'COMPLETED' ? 'Settlement service (simulated)' : 'Assigned rider (simulated)';
    const at = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    order.history = Array.isArray(order.history) ? order.history : [];
    order.history.push({ state: requestedState, actor, at });
    order.history = order.history.slice(-20);
    if (requestedState === 'PROVIDER_ACCEPTED' && order.rider === 'Unassigned') {
      order.provider = 'Eligible individual rider';
      order.rider = 'Sample rider';
    }
    saveState();
    render();
    renderOrderModal(orderId);
    toast(`${order.id} advanced to ${ORDER_STATE_LABELS[requestedState]}. Demo only; no external verification occurred.`);
  }

  function addTestOrder() {
    const suffix = `${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
    const at = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    const order = {
      id: `EX-D${suffix}`,
      workflow: 'errand',
      state: 'REQUESTED',
      service: 'Document errand',
      customer: 'Demo customer',
      provider: 'Awaiting eligible rider',
      rider: 'Unassigned',
      area: testOrderArea(),
      total: 3200,
      created: at,
      history: [{ state: 'REQUESTED', actor: 'Customer (simulated)', at }]
    };
    state.orders.unshift(order);
    saveState();
    render();
    if (activePage === 'assignment-queue') renderAssignmentModal(order.id);
    else renderOrderModal(order.id);
    toast('Test order added. Continue through the state machine to explore the demo.');
  }

  function renderFormsPage() {
    if (editingFormId) {
      const editing = state.forms.find((form) => form.id === editingFormId);
      if (editing) return renderFormEditor(editing);
      editingFormId = null;
    }
    const forms = state.forms || [];
    const publishedCount = forms.filter((form) => Boolean(form.published)).length;
    const fieldCount = forms.reduce((sum, form) => sum + form.fields.length, 0);
    const conditionCount = forms.reduce((sum, form) => sum + form.fields.filter((field) => field.dependsOn).length, 0);
    const draftCount = forms.filter((form) => form.status !== 'Published').length;
    const stats = [
      ['Form templates', String(forms.length), 'Versioned service forms', 'file', 'green'],
      ['Configured fields', String(fieldCount), 'Across current drafts', 'clipboard', 'blue'],
      ['Conditional fields', String(conditionCount), 'Show based on earlier answers', 'settings', 'orange'],
      ['Draft changes', String(draftCount), 'Preview before publishing', 'clock', 'amber']
    ];
    const rows = forms.map((form) => `<tr>
      <td><div class="table-person"><span class="table-avatar">${icon('file')}</span><span><strong>${escapeHTML(form.name)}</strong><small>${escapeHTML(form.service)} · ${form.fields.length} fields</small></span></div></td>
      <td><span class="basis-label">${escapeHTML(form.service)}</span></td>
      <td><span class="rate-primary">${form.published ? `v${Number(form.published.version) || 1}` : 'Not published'}</span></td>
      <td><span class="badge badge-${form.status === 'Published' ? 'green' : 'amber'}">${escapeHTML(form.status)}</span></td>
      <td><span class="scope-label">${escapeHTML(form.updated || 'Not published')}</span></td>
      <td><span class="row-controls"><button class="button button-secondary order-open-button" type="button" data-action="preview-form" data-id="${escapeAttr(form.id)}">Preview</button><button class="button button-primary order-open-button" type="button" data-action="edit-form" data-id="${escapeAttr(form.id)}">Edit</button></span></td>
    </tr>`).join('');
    const buttons = `<button class="button button-secondary" type="button" data-action="form-guidance">${icon('info')}<span>Versioning notes</span></button><button class="button button-primary" type="button" data-action="new-form">${icon('plus')}<span>Create form</span></button>`;
    return `<div class="page forms-page">
      ${renderPageHeading('Dynamic order forms', 'PLATFORM / FORM BUILDER', 'Build configurable errand and vendor forms from validated fields, then publish versioned layouts without changing historic orders.', buttons)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>Adapt the questions to the service</h2><p>Choose from addresses, item details, contact fields, selections and uploads. Add conditions that reveal follow-up questions only when an earlier answer needs them.</p></div><span class="module-hero-badge">${icon('file')}Draft · preview · publish · history</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">Service form library</h2><p class="card-subtitle">Each published version is preserved so an existing order can still be rendered with its original fields.</p></div><span class="badge badge-blue">${publishedCount} published</span></div>
        <div class="table-scroll"><table class="module-table form-library-table"><thead><tr><th>Form</th><th>Service type</th><th>Published version</th><th>Status</th><th>Last updated</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="6"><div class="empty-state">No forms yet. Create one to start building a service request.</div></td></tr>'}</tbody></table></div>
        <div class="table-foot"><span><strong>${forms.length}</strong> form templates · ${conditionCount} conditional fields</span><span>Browser-only demo</span></div>
      </section>
      <div class="rule-note">${icon('shield')}<span><strong>Publishing safeguard.</strong> Layouts should be stored as validated JSON and rendered through approved components. Do not execute custom PHP or JavaScript from a form editor.</span></div>
    </div>`;
  }

  function renderFormEditor(form) {
    const stateBadge = form.status === 'Published' ? 'green' : 'amber';
    const fields = form.fields.map((field, index) => `<article class="builder-field-card">
      <span class="builder-field-index">${String(index + 1).padStart(2, '0')}</span>
      <div class="builder-field-main"><div class="builder-field-title-row"><strong>${escapeHTML(field.label)}</strong><span class="badge badge-gray">${escapeHTML(FORM_FIELD_TYPES[field.type] || 'Short text')}</span>${field.required ? '<span class="badge badge-blue">Required</span>' : '<span class="badge badge-gray">Optional</span>'}${field.dependsOn ? '<span class="badge badge-amber">Conditional</span>' : ''}</div><small><code>${escapeHTML(field.key)}</code>${field.help ? ` · ${escapeHTML(field.help)}` : ''}${field.dependsOn ? ` · Show when ${escapeHTML(field.dependsOn)} = ${escapeHTML(field.conditionValue)}` : ''}</small></div>
      <div class="builder-field-controls"><button class="icon-action" type="button" data-action="move-form-field" data-form-id="${escapeAttr(form.id)}" data-field-id="${escapeAttr(field.id)}" data-direction="up" ${index === 0 ? 'disabled' : ''} aria-label="Move ${escapeAttr(field.label)} up">${icon('arrow-up')}</button><button class="icon-action" type="button" data-action="move-form-field" data-form-id="${escapeAttr(form.id)}" data-field-id="${escapeAttr(field.id)}" data-direction="down" ${index === form.fields.length - 1 ? 'disabled' : ''} aria-label="Move ${escapeAttr(field.label)} down">${icon('arrow-up', 'icon icon-rotate-180')}</button><button class="icon-action" type="button" data-action="edit-form-field" data-form-id="${escapeAttr(form.id)}" data-field-id="${escapeAttr(field.id)}" aria-label="Edit ${escapeAttr(field.label)}">${icon('edit')}</button><button class="icon-action danger-action" type="button" data-action="remove-form-field" data-form-id="${escapeAttr(form.id)}" data-field-id="${escapeAttr(field.id)}" aria-label="Remove ${escapeAttr(field.label)}">${icon('close')}</button></div>
    </article>`).join('');
    const buttons = `<button class="button button-secondary" type="button" data-action="close-form-editor">${icon('arrow-right', 'icon icon-rotate-180')}<span>Form library</span></button><button class="button button-secondary" type="button" data-action="show-form-history" data-id="${escapeAttr(form.id)}">${icon('clock')}<span>Version history</span></button><button class="button button-secondary" type="button" data-action="preview-form" data-id="${escapeAttr(form.id)}">${icon('eye')}<span>Preview draft</span></button>`;
    return `<div class="page form-editor-page">
      ${renderPageHeading(form.name, 'PLATFORM / FORM BUILDER', 'Edit the form schema, reorder fields and preview customer questions before publishing.', buttons)}
      <div class="form-editor-status-bar"><span class="badge badge-${stateBadge}">${escapeHTML(form.status)}${form.published ? ` · Published v${form.published.version}` : ''}</span><span>${form.published ? `${form.history.length} earlier version${form.history.length === 1 ? '' : 's'} retained` : 'Unpublished draft'} · Changes are local until published.</span></div>
      <section class="card form-meta-card"><div class="card-header"><div><h2 class="card-title">Form details</h2><p class="card-subtitle">Changing this draft does not rewrite the last published version.</p></div><button class="button button-secondary" type="button" data-action="save-form-draft">${icon('check')}<span>Save draft</span></button></div><div class="form-meta-grid"><div class="form-field"><label class="field-label" for="editFormName">Form name</label><input id="editFormName" class="input-control" type="text" maxlength="100" value="${escapeAttr(form.name)}"><div class="form-error">Enter a form name.</div></div><div class="form-field"><label class="field-label" for="editFormService">Service type</label><select id="editFormService" class="select-control">${['Errands', 'Food delivery', 'Small chops', 'Company dispatch'].map((service) => `<option ${service === form.service ? 'selected' : ''}>${escapeHTML(service)}</option>`).join('')}</select></div></div></section>
      <section class="card form-fields-card"><div class="card-header"><div><h2 class="card-title">Form fields <span class="field-count">${form.fields.length}</span></h2><p class="card-subtitle">Use the arrow controls to reorder fields. Conditional questions can depend on an earlier field.</p></div><button class="button button-primary" type="button" data-action="add-form-field" data-form-id="${escapeAttr(form.id)}">${icon('plus')}<span>Add field</span></button></div>
        <div class="builder-field-list">${fields || '<div class="empty-state builder-empty">No fields yet. Add a pickup address, service details or another validated field.</div>'}</div>
        <div class="form-builder-footer">${icon('info')}<span>Publishing creates a new immutable form version. Previous order records keep the version they were created with.</span></div>
      </section>
      <div class="form-publish-row"><span>Current published version: <strong>${form.published ? `v${form.published.version}` : 'None'}</strong></span><button class="button button-primary" type="button" data-action="publish-form" data-id="${escapeAttr(form.id)}">${icon('check')}<span>Publish version</span></button></div>
    </div>`;
  }

  function renderNewFormModal() {
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="newFormTitle"><header class="modal-header"><div><h2 id="newFormTitle">Create order form</h2><p>Start with a service type, then add the fields customers need to complete the request.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><div class="modal-body"><div class="form-field"><label class="field-label" for="newFormName">Form name</label><input id="newFormName" class="input-control" type="text" maxlength="100" placeholder="e.g. Pharmacy pickup"><div class="form-error">Enter a form name.</div></div><div class="form-field"><label class="field-label" for="newFormService">Service type</label><select id="newFormService" class="select-control"><option>Errands</option><option>Food delivery</option><option>Small chops</option><option>Company dispatch</option></select></div><p class="field-help">The new form starts as an unpublished draft and can be edited before it appears to customers.</p></div><footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Demo data · browser only</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="save-new-form">${icon('plus')}<span>Create form</span></button></div></footer></section></div>`;
    document.getElementById('newFormName')?.focus();
  }

  function renderFieldOptions(field) {
    const choices = ['select', 'radio', 'checkbox'].includes(field.type);
    return `<div class="form-field form-span-2 field-options-wrapper" id="fieldOptionsWrapper" ${choices ? '' : 'hidden'}><label class="field-label" for="fieldOptions">Choices <small>one option per line</small></label><textarea id="fieldOptions" class="textarea-control" rows="3" placeholder="Option one\nOption two">${escapeHTML((field.options || []).join('\n'))}</textarea><div class="form-error">Add at least one choice.</div></div>`;
  }

  function renderFormFieldModal(formId, fieldId = null) {
    const form = state.forms.find((item) => item.id === formId);
    if (!form) return;
    const existing = form.fields.find((field) => field.id === fieldId) || null;
    const field = existing || { id: '', key: '', label: '', type: 'text', required: false, help: '', options: [], dependsOn: '', conditionValue: '' };
    const position = existing ? form.fields.findIndex((item) => item.id === existing.id) : form.fields.length;
    const dependencies = form.fields.slice(0, Math.max(0, position)).filter((item) => item.key && item.id !== fieldId);
    const body = `<form id="formFieldForm" novalidate><input type="hidden" name="formId" value="${escapeAttr(formId)}"><input type="hidden" name="fieldId" value="${escapeAttr(field.id)}"><div class="modal-form-grid">
      <div class="form-field"><label class="field-label" for="fieldLabel">Field label</label><input id="fieldLabel" class="input-control" type="text" maxlength="100" value="${escapeAttr(field.label)}" placeholder="e.g. Recipient phone number"><div class="form-error">Enter a field label.</div></div>
      <div class="form-field"><label class="field-label" for="fieldKey">Internal key</label><input id="fieldKey" class="input-control" type="text" maxlength="60" value="${escapeAttr(field.key)}" placeholder="recipient_phone"><div class="field-help">Use lowercase letters, numbers and underscores.</div><div class="form-error">Use a unique key like recipient_phone.</div></div>
      <div class="form-field form-span-2"><label class="field-label" for="fieldType">Field type</label><select id="fieldType" class="select-control">${Object.entries(FORM_FIELD_TYPES).map(([type, label]) => `<option value="${escapeAttr(type)}" ${type === field.type ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('')}</select><div class="field-help">Address and upload fields are validated components, not executable custom code.</div></div>
      <div class="form-field form-span-2"><label class="field-label" for="fieldHelp">Help text <small>optional</small></label><input id="fieldHelp" class="input-control" type="text" maxlength="240" value="${escapeAttr(field.help || '')}" placeholder="Give the customer a helpful hint"></div>
      ${renderFieldOptions(field)}
      <div class="form-field"><label class="field-label" for="fieldDependsOn">Show conditionally <small>optional</small></label><select id="fieldDependsOn" class="select-control"><option value="">Always show this field</option>${dependencies.map((dependency) => `<option value="${escapeAttr(dependency.key)}" ${dependency.key === field.dependsOn ? 'selected' : ''}>After “${escapeHTML(dependency.label)}”</option>`).join('')}</select></div>
      <div class="form-field"><label class="field-label" for="fieldConditionValue">Show when answer equals</label><input id="fieldConditionValue" class="input-control" type="text" maxlength="100" value="${escapeAttr(field.conditionValue || '')}" placeholder="e.g. Yes"><div class="form-error">Choose a trigger answer for a conditional field.</div></div>
      <label class="checkbox-chip field-required-chip"><input id="fieldRequired" type="checkbox" ${field.required ? 'checked' : ''}>Customer must complete this field</label>
    </div></form>`;
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="fieldModalTitle"><header class="modal-header"><div><h2 id="fieldModalTitle">${existing ? 'Edit form field' : 'Add form field'}</h2><p>Configure the label, validation and optional condition for this field.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><div class="modal-body">${body}</div><footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Validated components only · Demo workspace</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="save-form-field">${icon('check')}<span>Save field</span></button></div></footer></section></div>`;
    document.getElementById('fieldLabel')?.focus();
  }

  function slugifyFieldKey(value) {
    return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
  }

  function renderFormPreviewField(field) {
    const fieldId = `preview-${safeId(field.id)}`;
    const attr = `data-preview-key="${escapeAttr(field.key)}"`;
    const required = field.required ? 'required' : '';
    let control = '';
    if (field.type === 'textarea' || field.type === 'instructions') {
      control = `<textarea id="${escapeAttr(fieldId)}" class="textarea-control" ${attr} ${required} placeholder="${escapeAttr(field.help || '')}"></textarea>`;
    } else if (field.type === 'select' || field.type === 'location') {
      const options = field.type === 'location' ? ['Choose a location', 'Kano Municipal', 'Nassarawa LGA', 'Tarauni LGA'] : ['Choose an option', ...(field.options || [])];
      control = `<select id="${escapeAttr(fieldId)}" class="select-control" ${attr} ${required}>${options.map((option, index) => `<option value="${index === 0 ? '' : escapeAttr(option)}">${escapeHTML(option)}</option>`).join('')}</select>`;
    } else if (field.type === 'radio' || field.type === 'checkbox') {
      control = `<div class="preview-choice-group">${(field.options || []).map((option, index) => `<label class="checkbox-chip"><input type="${field.type}" id="${escapeAttr(fieldId)}-${index}" name="${escapeAttr(fieldId)}" value="${escapeAttr(option)}" ${attr}>${escapeHTML(option)}</label>`).join('')}</div>`;
    } else {
      const inputType = field.type === 'phone' ? 'tel' : field.type === 'image' || field.type === 'file' ? 'file' : ['number', 'date', 'time'].includes(field.type) ? field.type : 'text';
      const accept = field.type === 'image' ? 'accept="image/*"' : field.type === 'file' ? 'accept=".pdf,.doc,.docx,image/*"' : '';
      const placeholder = ['pickup', 'destination'].includes(field.type) ? (field.type === 'pickup' ? 'Enter pickup address or landmark' : 'Enter destination address or landmark') : field.type === 'phone' ? '080 0000 0000' : '';
      control = `<input id="${escapeAttr(fieldId)}" class="input-control" type="${inputType}" ${attr} ${required} ${accept} placeholder="${escapeAttr(placeholder)}">`;
    }
    return `<div class="form-field preview-form-field" data-preview-condition="${escapeAttr(field.dependsOn || '')}" data-preview-condition-value="${escapeAttr(field.conditionValue || '')}" ${field.dependsOn ? 'hidden' : ''}><label class="field-label" for="${escapeAttr(fieldId)}">${escapeHTML(field.label)}${field.required ? ' <span class="required-star">*</span>' : ''}</label>${control}${field.help && !['pickup', 'destination'].includes(field.type) ? `<div class="field-help">${escapeHTML(field.help)}</div>` : ''}</div>`;
  }

  function renderFormPreview(form, snapshot = null) {
    const current = snapshot || { name: form.name, service: form.service, version: form.version, fields: form.fields };
    const isDraft = !snapshot && form.status !== 'Published';
    const fields = Array.isArray(current.fields) ? current.fields : [];
    const renderedFields = fields.map(renderFormPreviewField).join('');
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal form-preview-modal" role="dialog" aria-modal="true" aria-labelledby="formPreviewTitle"><header class="modal-header"><div><span class="badge ${isDraft ? 'badge-amber' : 'badge-green'}">${isDraft ? 'Draft preview' : `Published v${current.version}`}</span><h2 id="formPreviewTitle" style="margin-top:8px">${escapeHTML(current.name)}</h2><p>${escapeHTML(current.service)} · Customer request preview</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><div class="modal-body"><div class="preview-form-shell"><div class="preview-form-intro"><span class="preview-brand-mark">${icon('spark')}</span><div><strong>${escapeHTML(current.name)}</strong><small>Complete the details so your provider knows what to do.</small></div></div>${renderedFields || '<div class="empty-state">This form has no fields yet.</div>'}<button class="button button-primary preview-submit-button" type="button" data-action="preview-submit">Continue to provider selection ${icon('arrow-right')}</button></div><p class="field-help preview-footnote">Preview only. Responses are not submitted or stored.</p></div><footer class="modal-footer"><span class="modal-footer-note">${icon('info')}No response data is collected</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close preview</button></div></footer></section></div>`;
    refreshFormPreviewConditions();
  }

  function refreshFormPreviewConditions() {
    const controls = Array.from(document.querySelectorAll('[data-preview-key]'));
    document.querySelectorAll('[data-preview-condition]').forEach((container) => {
      const key = container.dataset.previewCondition;
      if (!key) { container.hidden = false; return; }
      const matching = controls.filter((control) => control.dataset.previewKey === key);
      const selected = matching.filter((control) => control.type === 'radio' || control.type === 'checkbox').filter((control) => control.checked).map((control) => control.value);
      const groupedChoices = matching.some((control) => control.type === 'radio' || control.type === 'checkbox');
      const value = groupedChoices ? selected : matching.map((control) => control.value).filter(Boolean);
      container.hidden = !value.includes(container.dataset.previewConditionValue);
    });
  }

  function renderFormHistory(form) {
    const versions = [];
    if (form.published) versions.push({ ...form.published, date: form.updated || 'Current published version', current: true });
    (form.history || []).slice().reverse().forEach((version) => versions.push({ ...version, current: false }));
    const rows = versions.map((version) => `<div class="version-history-row"><div class="version-badge">v${Number(version.version) || 0}</div><div class="version-history-copy"><strong>${escapeHTML(version.name || form.name)}${version.current ? ' · Current' : ''}</strong><small>${escapeHTML(version.service || form.service)} · ${Number(version.fieldCount ?? version.fields?.length) || 0} fields · ${escapeHTML(version.date || 'Published')}</small></div><button class="button button-secondary order-open-button" type="button" data-action="preview-form-version" data-id="${escapeAttr(form.id)}" data-version="${Number(version.version) || 0}" ${version.fields ? '' : 'disabled'}>Preview</button></div>`).join('');
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="formHistoryTitle"><header class="modal-header"><div><h2 id="formHistoryTitle">Form version history</h2><p>${escapeHTML(form.name)} · Published versions are snapshots; historical orders retain their original version.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><div class="modal-body"><div class="version-history-list">${rows || '<div class="empty-state">No published versions yet.</div>'}</div></div><footer class="modal-footer"><span class="modal-footer-note">${icon('shield')}History is read-only in this demo</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button></div></footer></section></div>`;
  }

  function saveNewForm() {
    const nameInput = document.getElementById('newFormName');
    const name = nameInput?.value.trim() || '';
    if (!name) { nameInput?.closest('.form-field')?.classList.add('has-error'); nameInput?.focus(); return; }
    const id = `form-${slugifyFieldKey(name) || Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const service = document.getElementById('newFormService')?.value || 'Errands';
    state.forms.unshift({ id, name, service, version: 0, status: 'Draft', updated: 'Not published', fields: [], published: null, history: [] });
    editingFormId = id;
    saveState();
    closeModal();
    render();
    toast('Draft form created. Add fields and publish when it is ready.');
  }

  function saveFormMetadata(publish = false) {
    const form = state.forms.find((item) => item.id === editingFormId);
    if (!form) return false;
    const nameInput = document.getElementById('editFormName');
    const name = nameInput?.value.trim() || '';
    if (!name) { nameInput?.closest('.form-field')?.classList.add('has-error'); nameInput?.focus(); return false; }
    if (publish && form.fields.length === 0) { toast('Add at least one field before publishing this form.'); return false; }
    const keys = new Set();
    for (let index = 0; index < form.fields.length; index += 1) {
      const field = form.fields[index];
      if (!field.label.trim() || !/^[a-z][a-z0-9_]*$/.test(field.key) || keys.has(field.key)) {
        toast('Check field labels and unique internal keys before publishing.');
        return false;
      }
      if (field.dependsOn && !form.fields.slice(0, index).some((earlier) => earlier.key === field.dependsOn)) {
        toast('A conditional field must depend on a preceding field.');
        return false;
      }
      keys.add(field.key);
    }
    form.name = name;
    form.service = document.getElementById('editFormService')?.value || form.service;
    if (publish) {
      if (form.published) {
        form.history = Array.isArray(form.history) ? form.history : [];
        form.history.push({
          version: form.published.version,
          date: form.updated || new Date().toLocaleDateString('en-GB'),
          fieldCount: form.published.fields.length,
          name: form.published.name,
          service: form.published.service,
          fields: structuredCloneSafe(form.published.fields)
        });
        form.history = form.history.slice(-10);
      }
      form.version = Math.max(Number(form.version) || 0, Number(form.published?.version) || 0) + 1;
      form.published = { version: form.version, name: form.name, service: form.service, fields: structuredCloneSafe(form.fields) };
      form.status = 'Published';
      form.updated = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date());
    } else {
      form.status = form.published ? 'Draft changes' : 'Draft';
      form.updated = 'Draft saved in browser';
    }
    saveState();
    render();
    toast(publish ? `Published ${form.name} v${form.version}. Previous versions are preserved.` : 'Form draft saved in this browser.');
    return true;
  }

  function syncFieldModalType() {
    const wrapper = document.getElementById('fieldOptionsWrapper');
    if (!wrapper) return;
    wrapper.hidden = !['select', 'radio', 'checkbox'].includes(document.getElementById('fieldType')?.value);
  }

  function saveFormField() {
    const formEl = document.getElementById('formFieldForm');
    if (!formEl) return;
    const formId = formEl.elements.formId.value;
    const form = state.forms.find((item) => item.id === formId);
    if (!form) return;
    const existingId = formEl.elements.fieldId.value;
    const labelInput = document.getElementById('fieldLabel');
    const keyInput = document.getElementById('fieldKey');
    const label = labelInput.value.trim();
    const key = keyInput.value.trim() || slugifyFieldKey(label);
    keyInput.value = key;
    let valid = true;
    labelInput.closest('.form-field').classList.remove('has-error');
    keyInput.closest('.form-field').classList.remove('has-error');
    if (!label) { labelInput.closest('.form-field').classList.add('has-error'); valid = false; }
    if (!/^[a-z][a-z0-9_]*$/.test(key) || form.fields.some((field) => field.key === key && field.id !== existingId)) { keyInput.closest('.form-field').classList.add('has-error'); valid = false; }
    const type = document.getElementById('fieldType').value;
    const optionValues = ['select', 'radio', 'checkbox'].includes(type) ? (document.getElementById('fieldOptions')?.value || '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean) : [];
    const optionsWrapper = document.getElementById('fieldOptionsWrapper');
    if (optionsWrapper && !optionsWrapper.hidden && optionValues.length === 0) { optionsWrapper.classList.add('has-error'); valid = false; }
    const dependsOn = document.getElementById('fieldDependsOn').value;
    const conditionValue = document.getElementById('fieldConditionValue').value.trim();
    const dependency = form.fields.find((item) => item.key === dependsOn && item.id !== existingId);
    const invalidChoice = dependency && ['select', 'radio', 'checkbox'].includes(dependency.type) && !(dependency.options || []).includes(conditionValue);
    const conditionField = document.getElementById('fieldConditionValue').closest('.form-field');
    conditionField.classList.remove('has-error');
    if (dependsOn && (!conditionValue || invalidChoice)) { conditionField.classList.add('has-error'); valid = false; }
    if (!valid) { formEl.querySelector('.form-field.has-error input, .form-field.has-error textarea')?.focus(); return; }
    const old = form.fields.find((field) => field.id === existingId);
    const field = {
      id: existingId || `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      key, label, type, required: document.getElementById('fieldRequired').checked,
      help: document.getElementById('fieldHelp').value.trim(),
      options: optionValues,
      dependsOn, conditionValue
    };
    if (old) {
      const index = form.fields.findIndex((item) => item.id === old.id);
      form.fields[index] = field;
      if (old.key !== field.key) form.fields.forEach((item) => { if (item.dependsOn === old.key) item.dependsOn = field.key; });
    } else form.fields.push(field);
    form.status = form.published ? 'Draft changes' : 'Draft';
    form.updated = 'Draft saved in browser';
    saveState();
    closeModal();
    render();
    toast(old ? 'Form field updated in this browser.' : 'Form field added to the draft.');
  }

  function moveFormField(formId, fieldId, direction) {
    const form = state.forms.find((item) => item.id === formId);
    if (!form) return;
    const index = form.fields.findIndex((field) => field.id === fieldId);
    const target = index + (direction === 'up' ? -1 : 1);
    if (index < 0 || target < 0 || target >= form.fields.length) return;
    [form.fields[index], form.fields[target]] = [form.fields[target], form.fields[index]];
    let removedCondition = false;
    form.fields.forEach((field, position) => {
      if (field.dependsOn && !form.fields.slice(0, position).some((previous) => previous.key === field.dependsOn)) {
        field.dependsOn = '';
        field.conditionValue = '';
        removedCondition = true;
      }
    });
    form.status = form.published ? 'Draft changes' : 'Draft';
    form.updated = 'Draft saved in browser';
    saveState();
    render();
    toast(removedCondition ? 'Fields reordered. A condition was cleared because it no longer referenced an earlier field.' : 'Field order updated.');
  }

  function removeFormField(formId, fieldId) {
    const form = state.forms.find((item) => item.id === formId);
    if (!form) return;
    const field = form.fields.find((item) => item.id === fieldId);
    if (!field) return;
    form.fields = form.fields.filter((item) => item.id !== fieldId);
    form.fields.forEach((item) => { if (item.dependsOn === field.key) { item.dependsOn = ''; item.conditionValue = ''; } });
    form.status = form.published ? 'Draft changes' : 'Draft';
    form.updated = 'Draft saved in browser';
    saveState();
    render();
    toast('Field removed from the draft. Published versions are unchanged.');
  }

  function providerDirectoryRows(pageKey) {
    return filteredProviders(pageKey).map((provider) => {
      const load = providerLoad(provider);
      const scopes = provider.coverage.map((scope) => `${scope.areas.length ? scope.areas.join(', ') : 'Entire LGA'} · ${scope.lga}, ${scope.state}`).join(' / ');
      const approval = provider.approved
        ? `<span class="badge badge-green">Partner approved</span>`
        : `<span class="badge badge-amber">Partner review needed</span>`;
      const fleetApproval = provider.type === 'company_rider'
        ? `<span class="badge badge-${provider.companyApproved ? 'green' : 'amber'}">${provider.companyApproved ? 'Fleet approved' : 'Fleet review needed'}</span>`
        : '';
      const dispatchStatus = !provider.approved ? ['Approval needed', 'amber'] : provider.type === 'company_rider' && !provider.companyApproved ? ['Fleet approval needed', 'amber'] : !provider.coverage.length ? ['Coverage needed', 'amber'] : !provider.online ? ['Offline', 'gray'] : !provider.available ? ['Not accepting', 'orange'] : load >= provider.capacity ? ['At capacity', 'amber'] : ['Online · available', 'green'];
      return `<tr>
        <td><div class="table-person"><span class="table-avatar">${escapeHTML(initials(provider.name))}</span><span><strong>${escapeHTML(provider.name)}</strong><small>${escapeHTML(provider.id)} · ${escapeHTML(provider.label)}${provider.company ? ` · ${escapeHTML(provider.company)}` : ''}</small></span></div></td>
        <td><div class="provider-approval-stack">${approval}${fleetApproval}</div></td>
        <td><span class="provider-coverage-summary">${escapeHTML(scopes || 'No configured coverage')}</span></td>
        <td><span class="provider-load-value">${load}<small> / ${provider.capacity}</small></span><small class="provider-load-label">active jobs</small></td>
        <td><span class="badge badge-${dispatchStatus[1]}">${escapeHTML(dispatchStatus[0])}</span></td>
        <td><button class="button button-secondary order-open-button" type="button" data-action="edit-provider-settings" data-id="${escapeAttr(provider.id)}">Manage ${icon('arrow-right')}</button></td>
      </tr>`;
    }).join('');
  }

  function filteredProviders(pageKey) {
    const types = pageKey === 'riders' ? ['individual_rider', 'company_rider'] : ['restaurant', 'small_chops'];
    const query = providerDirectorySearch.trim().toLowerCase();
    return state.providers.filter((provider) => {
      if (!types.includes(provider.type)) return false;
      const load = providerLoad(provider);
      const dispatchReady = provider.approved && (provider.type !== 'company_rider' || provider.companyApproved) && provider.online && provider.available && provider.coverage.length > 0 && load < provider.capacity;
      const needsApproval = !provider.approved || (provider.type === 'company_rider' && !provider.companyApproved);
      if (providerDirectoryFilter === 'ready' && !dispatchReady) return false;
      if (providerDirectoryFilter === 'unavailable' && dispatchReady) return false;
      if (providerDirectoryFilter === 'review' && !needsApproval) return false;
      if (!query) return true;
      return [provider.id, provider.name, provider.label, provider.company, ...provider.coverage.map((scope) => `${scope.state} ${scope.lga} ${scope.areas.join(' ')}`)].join(' ').toLowerCase().includes(query);
    });
  }

  function renderProviderDirectoryPage(pageKey) {
    const meta = PAGE_META[pageKey];
    const providers = state.providers.filter((provider) => pageKey === 'riders' ? ['individual_rider', 'company_rider'].includes(provider.type) : ['restaurant', 'small_chops'].includes(provider.type));
    const ready = providers.filter((provider) => provider.approved && (provider.type !== 'company_rider' || provider.companyApproved) && provider.online && provider.available && provider.coverage.length > 0 && providerLoad(provider) < provider.capacity).length;
    const active = providers.filter((provider) => provider.online).length;
    const needsReview = providers.filter((provider) => !provider.approved || (provider.type === 'company_rider' && !provider.companyApproved)).length;
    const filters = [
      ['all', 'All partners', providers.length],
      ['ready', 'Dispatch ready', ready],
      ['unavailable', 'Not dispatch ready', providers.length - ready],
      ['review', 'Approval needed', needsReview]
    ];
    const buttons = `<button class="button button-secondary" type="button" data-page="locations">${icon('map')}<span>Service areas</span></button><button class="button button-primary" type="button" data-page="assignment-queue">${icon('clipboard')}<span>Assignment queue</span></button>`;
    const stats = [
      [pageKey === 'riders' ? 'Rider profiles' : 'Vendor profiles', String(providers.length), pageKey === 'riders' ? 'Individual and fleet riders' : 'Restaurants and small-chops', pageKey === 'riders' ? 'bike' : 'store', 'green'],
      ['Dispatch ready', String(ready), 'Approval, coverage, availability and capacity', 'check', 'blue'],
      ['Online', String(active), 'May still be unavailable or full', 'activity', 'orange'],
      ['Approval needed', String(needsReview), 'Review before matching', 'shield', 'amber']
    ];
    const rows = providerDirectoryRows(pageKey);
    return `<div class="page provider-directory-page">
      ${renderPageHeading(meta.title, meta.eyebrow, 'Manage demo provider availability, workload limits and service-area coverage. These local settings immediately affect Assignment Queue eligibility.', buttons)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>${pageKey === 'riders' ? 'Availability is not the same as approval.' : 'Partner readiness, by configured service area.'}</h2><p>${pageKey === 'riders' ? 'Company fleet approval and each rider’s approval are checked independently. Set demo online status, availability, capacity and coverage below.' : 'Restaurants and small-chops vendors have separate service types. Online status, capacity and configured coverage determine which requests can be offered.'}</p></div><span class="module-hero-badge">${icon('shield')}Demo controls · Browser only</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">${escapeHTML(meta.sectionTitle)}</h2><p class="card-subtitle">Partner and fleet approval derive from linked sample Applications; review decisions affect demo matching only.</p></div><span class="badge badge-blue">${providers.length} demo profiles</span></div>
        <div class="provider-toolbar"><div class="rule-filters provider-filters" role="group" aria-label="Filter provider profiles">${filters.map(([key, label, count]) => `<button class="filter-button ${providerDirectoryFilter === key ? 'active' : ''}" type="button" data-provider-filter="${escapeAttr(key)}">${escapeHTML(label)} <span>${count}</span></button>`).join('')}</div><label class="search-field"><span class="sr-only">Search provider profiles</span>${icon('search')}<input id="providerDirectorySearch" type="search" placeholder="Search provider, company or coverage…" value="${escapeAttr(providerDirectorySearch)}"></label></div>
        <div class="table-scroll"><table class="module-table provider-directory-table"><thead><tr><th>Provider</th><th>Approval</th><th>Configured service coverage</th><th>Workload</th><th>Dispatch status</th><th>Controls</th></tr></thead><tbody id="providerDirectoryBody">${rows || '<tr><td colspan="6"><div class="empty-state">No providers match this view. Try another filter.</div></td></tr>'}</tbody></table></div>
        <div class="table-foot"><span id="providerCountFoot">Showing <strong>${filteredProviders(pageKey).length}</strong> of ${providers.length} demo profiles</span><span>Sample providers · Not live availability</span></div>
      </section>
      <div class="rule-note">${icon('info')}<span><strong>Approval safeguard.</strong> Partner and company approval are linked to the corresponding mock application decisions. Production dispatch must use server-verified identity review, company approval and live availability.</span></div>
    </div>`;
  }

  function providerLocationFromKey(key) {
    const match = /^(\d+):(\d+)$/.exec(String(key || ''));
    if (!match) return null;
    const coverageState = state.coverage[Number(match[1])];
    const lga = coverageState?.lgas[Number(match[2])];
    return coverageState && lga ? { coverageState, lga } : null;
  }

  function providerLocationKey(stateName, lgaName) {
    const stateIndex = state.coverage.findIndex((item) => item.name === stateName);
    const lgaIndex = state.coverage[stateIndex]?.lgas.findIndex((item) => item.name === lgaName) ?? -1;
    return stateIndex >= 0 && lgaIndex >= 0 ? `${stateIndex}:${lgaIndex}` : '';
  }

  function providerCoverageOptions(key, selected = '') {
    const location = providerLocationFromKey(key);
    const options = location ? `<option value="*" ${selected === '*' ? 'selected' : ''}>Entire LGA · all configured neighborhoods</option>${location.lga.areas.map((area) => `<option value="${escapeAttr(area)}" ${selected === area ? 'selected' : ''}>${escapeHTML(area)}</option>`).join('')}` : '<option value="*">Entire LGA · all configured neighborhoods</option>';
    return `<option value="" disabled ${selected === '' ? 'selected' : ''}>Choose an LGA or neighborhood scope</option>${options}`;
  }

  function renderProviderCoverageRows(provider) {
    if (!provider.coverage.length) return '<p class="coverage-empty">No service areas configured for this provider.</p>';
    return provider.coverage.map((scope) => {
      const entries = scope.areas.length ? scope.areas.map((area) => ({ area, label: `${area} · ${scope.lga}, ${scope.state}` })) : [{ area: '*', label: `Entire LGA · ${scope.lga}, ${scope.state}` }];
      return entries.map((entry) => `<div class="provider-scope-row"><span>${icon('pin')}${escapeHTML(entry.label)}</span><button class="text-button" type="button" data-action="remove-provider-draft-scope" data-state="${escapeAttr(scope.state)}" data-lga="${escapeAttr(scope.lga)}" data-area="${escapeAttr(entry.area)}">Remove</button></div>`).join('');
    }).join('');
  }

  function renderProviderSettingsModal(providerId) {
    const provider = state.providers.find((item) => item.id === providerId);
    if (!provider) return;
    if (!providerDraft || providerDraft.id !== providerId) {
      providerDraft = { id: providerId, online: provider.online, available: provider.available, capacity: String(provider.capacity), coverage: structuredCloneSafe(provider.coverage) };
      providerCoverageLocationValue = state.coverage.find((item) => item.name === selectedLocation)?.lgas.length ? providerLocationKey(selectedLocation, state.coverage.find((item) => item.name === selectedLocation).lgas[0].name) : '';
      if (!providerCoverageLocationValue && state.coverage[0]?.lgas[0]) providerCoverageLocationValue = providerLocationKey(state.coverage[0].name, state.coverage[0].lgas[0].name);
      providerCoverageAreaValue = '';
    }
    const draft = providerDraft;
    const locationOptions = state.coverage.flatMap((coverageState, stateIndex) => coverageState.lgas.map((lga, lgaIndex) => `<option value="${stateIndex}:${lgaIndex}" ${providerLocationKey(coverageState.name, lga.name) === providerCoverageLocationValue ? 'selected' : ''}>${escapeHTML(lga.name)}, ${escapeHTML(coverageState.name)}</option>`)).join('');
    const approval = provider.approved ? 'Partner approval: approved (demo)' : 'Partner approval: not approved (demo)';
    const fleetApproval = provider.type === 'company_rider' ? `<p class="provider-modal-approval">Fleet approval: ${provider.companyApproved ? 'approved' : 'not approved'} (demo)</p>` : '';
    const scopeRows = renderProviderCoverageRows(draft);
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal provider-settings-modal" role="dialog" aria-modal="true" aria-labelledby="providerSettingsTitle">
      <header class="modal-header"><div><div class="eyebrow">${escapeHTML(provider.id)} <span class="eyebrow-separator">/</span> ${escapeHTML(provider.label)}</div><h2 id="providerSettingsTitle">Manage provider readiness</h2><p>${escapeHTML(provider.name)}${provider.company ? ` · ${escapeHTML(provider.company)}` : ''}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="modal-body"><div class="provider-modal-status"><span class="badge badge-${provider.approved ? 'green' : 'amber'}">${provider.approved ? 'Partner approved' : 'Approval needed'}</span>${provider.type === 'company_rider' ? `<span class="badge badge-${provider.companyApproved ? 'green' : 'amber'}">${provider.companyApproved ? 'Fleet approved' : 'Fleet approval needed'}</span>` : ''}</div><p class="provider-modal-approval">${escapeHTML(approval)} · Approval derives from linked mock Applications; no real identity or business verification occurred.</p>${fleetApproval}
        <div class="provider-settings-grid"><label class="provider-setting-toggle"><input id="providerOnline" type="checkbox" ${draft.online ? 'checked' : ''}><span><strong>Online</strong><small>Visible as online in the demo.</small></span></label><label class="provider-setting-toggle"><input id="providerAvailable" type="checkbox" ${draft.available ? 'checked' : ''}><span><strong>Accepting assignments</strong><small>Can receive new demo offers.</small></span></label><div class="form-field provider-capacity-field"><label class="field-label" for="providerCapacity">Maximum active jobs</label><input id="providerCapacity" class="input-control" type="number" min="1" max="50" step="1" value="${escapeAttr(draft.capacity)}"><small class="field-help">Current workload: ${providerLoad(provider)} active job${providerLoad(provider) === 1 ? '' : 's'}.</small><div class="form-error">Set a whole-number capacity from 1 to 50.</div></div></div>
        <section class="provider-coverage-editor"><div class="review-section-heading"><div><h3>Provider service coverage</h3><p>Scopes must exist in configured platform coverage. Broad LGA and neighborhood scopes are distinct.</p></div></div><div class="provider-scope-list">${scopeRows}</div><div class="provider-coverage-add"><label class="form-field"><span class="field-label">Configured LGA</span><select id="providerCoverageLocation" class="select-control" ${locationOptions ? '' : 'disabled'}>${locationOptions || '<option value="">No configured LGAs</option>'}</select></label><label class="form-field"><span class="field-label">Scope</span><select id="providerCoverageArea" class="select-control" ${locationOptions ? '' : 'disabled'}>${providerCoverageOptions(providerCoverageLocationValue, providerCoverageAreaValue)}</select></label><button class="button button-secondary" type="button" data-action="add-provider-draft-scope" ${locationOptions ? '' : 'disabled'}>${icon('plus')}<span>Add scope</span></button></div><p class="provider-coverage-help">Changes to coverage are included when you save this provider profile. They immediately affect future demo matches only.</p></section>
      </div><footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Local demo settings · No real status changed</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="save-provider-settings">${icon('check')}<span>Save profile</span></button></div></footer>
    </section></div>`;
    document.getElementById('providerCoverageLocation')?.addEventListener('change', (event) => {
      providerCoverageLocationValue = event.target.value;
      providerCoverageAreaValue = '';
      const areaSelect = document.getElementById('providerCoverageArea');
      if (areaSelect) {
        areaSelect.innerHTML = providerCoverageOptions(providerCoverageLocationValue, '');
        areaSelect.value = '';
      }
    });
    document.getElementById('providerCoverageArea')?.addEventListener('change', (event) => { providerCoverageAreaValue = event.target.value; });
  }

  function captureProviderDraftFields() {
    if (!providerDraft) return;
    const online = document.getElementById('providerOnline');
    const available = document.getElementById('providerAvailable');
    const capacity = document.getElementById('providerCapacity');
    if (online) providerDraft.online = online.checked;
    if (available) providerDraft.available = available.checked;
    if (capacity) providerDraft.capacity = capacity.value;
  }

  function addProviderDraftScope() {
    captureProviderDraftFields();
    if (!providerDraft) return;
    const location = providerLocationFromKey(document.getElementById('providerCoverageLocation')?.value || providerCoverageLocationValue);
    const area = document.getElementById('providerCoverageArea')?.value || providerCoverageAreaValue;
    if (!location) { toast('Choose a configured LGA before adding provider coverage.'); return; }
    if (!area) { toast('Choose an LGA-wide or neighborhood scope before adding it.'); return; }
    const { coverageState, lga } = location;
    const existing = providerDraft.coverage.find((scope) => scope.state === coverageState.name && scope.lga === lga.name);
    if (area === '*') {
      providerDraft.coverage = providerDraft.coverage.filter((scope) => scope.state !== coverageState.name || scope.lga !== lga.name);
      providerDraft.coverage.push({ state: coverageState.name, lga: lga.name, areas: [] });
    } else if (existing?.areas.length === 0) {
      toast('This provider already has broad coverage across that LGA. Remove it first to narrow the scope.');
      return;
    } else if (existing) {
      if (!existing.areas.includes(area)) existing.areas.push(area);
    } else {
      providerDraft.coverage.push({ state: coverageState.name, lga: lga.name, areas: [area] });
    }
    providerCoverageLocationValue = document.getElementById('providerCoverageLocation')?.value || providerCoverageLocationValue;
    providerCoverageAreaValue = '';
    renderProviderSettingsModal(providerDraft.id);
  }

  function removeProviderDraftScope(stateName, lgaName, area) {
    captureProviderDraftFields();
    if (!providerDraft) return;
    if (area === '*') {
      providerDraft.coverage = providerDraft.coverage.filter((scope) => scope.state !== stateName || scope.lga !== lgaName);
    } else {
      providerDraft.coverage = providerDraft.coverage.map((scope) => scope.state === stateName && scope.lga === lgaName ? { ...scope, areas: scope.areas.filter((item) => item !== area) } : scope).filter((scope) => scope.areas.length || !scope.state || !scope.lga);
    }
    renderProviderSettingsModal(providerDraft.id);
  }

  function saveProviderSettings() {
    captureProviderDraftFields();
    if (!providerDraft) return;
    const capacity = Number(providerDraft.capacity);
    const field = document.getElementById('providerCapacity')?.closest('.form-field');
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
      field?.classList.add('has-error');
      document.getElementById('providerCapacity')?.focus();
      return;
    }
    const provider = state.providers.find((item) => item.id === providerDraft.id);
    if (!provider) return;
    provider.online = Boolean(providerDraft.online);
    provider.available = Boolean(providerDraft.available);
    provider.capacity = capacity;
    provider.coverage = normalizeProviderCoverage(providerDraft.coverage, state.coverage);
    saveState();
    const name = provider.name;
    closeModal();
    render();
    toast(`${name} provider settings saved in this browser.`);
  }

  function renderStandardPage(pageKey) {
    const meta = PAGE_META[pageKey] || PAGE_META['live-orders'];
    const buttons = pageKey === 'website'
      ? `<a class="button button-secondary" href="/site.html" target="_blank" rel="noreferrer">${icon('globe')}<span>Preview public site</span></a><button class="button button-primary" type="button" data-action="module-action" data-module="website">${icon('plus')}<span>Edit draft</span></button>`
      : `<button class="button button-secondary" type="button" data-action="module-help">${icon('info')}<span>Module notes</span></button><button class="button button-primary" type="button" data-action="module-action" data-module="${escapeAttr(pageKey)}">${icon('plus')}<span>${escapeHTML(moduleActionLabel(pageKey))}</span></button>`;
    const tableRows = meta.rows.map((row) => `<tr><td><div class="table-person"><span class="table-avatar">${escapeHTML(row.initials || initials(row.name))}</span><span><strong>${escapeHTML(row.name)}</strong><small>${escapeHTML(row.detail)}</small></span></div></td><td><span class="basis-label">${escapeHTML(row.area)}</span></td><td><span class="rate-primary">${escapeHTML(row.amount)}</span></td><td><span class="badge badge-${escapeAttr(row.badge || 'gray')}">${escapeHTML(row.status)}</span></td><td><button class="icon-action" type="button" aria-label="Open ${escapeAttr(row.name)} details" data-action="record-info" data-name="${escapeAttr(row.name)}">${icon('arrow-right')}</button></td></tr>`).join('');
    const infoItems = (meta.infoItems || []).map((item) => `<div class="info-list-item">${icon('check')}<span>${escapeHTML(item)}</span></div>`).join('');
    return `<div class="page module-page">
      ${renderPageHeading(meta.title, meta.eyebrow, meta.description, buttons)}
      ${renderStatCards(meta.stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>${escapeHTML(meta.heroTitle)}</h2><p>${escapeHTML(meta.heroCopy)}</p></div><span class="module-hero-badge">${icon('info')}DEMO DATA · Browser only</span></div>
      <div class="module-content-grid">
        <section class="card"><div class="card-header"><div><h2 class="card-title">${escapeHTML(meta.sectionTitle)}</h2><p class="card-subtitle">${escapeHTML(meta.sectionCopy)}</p></div><button type="button" class="text-button" data-action="module-view-all">View all ${icon('arrow-right')}</button></div><div class="table-scroll"><table class="module-table"><thead><tr><th>Record</th><th>Location / owner</th><th>Amount / metric</th><th>Status</th><th><span class="sr-only">Open</span></th></tr></thead><tbody>${tableRows}</tbody></table></div><div class="table-foot"><span>Showing <strong>${meta.rows.length}</strong> illustrative records</span><span>Updated just now</span></div></section>
        <aside class="card module-info-card"><h3>${escapeHTML(meta.sideTitle)}</h3><p>${escapeHTML(meta.sideCopy)}</p><div class="info-list">${infoItems}</div><div style="margin-top:15px"><button class="button button-secondary" type="button" data-action="module-help">View module guidance ${icon('arrow-right')}</button></div></aside>
      </div>
    </div>`;
  }

  function renderLedgerPage() {
    const meta = PAGE_META.ledger;
    const entries = state.ledgerEntries.slice();
    const earned = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const entryStats = entries.length ? [
      ['Order-linked earnings', formatNaira(earned), `${entries.length} calculated demo line${entries.length === 1 ? '' : 's'}`, 'banknote', 'orange'],
      ['Pending settlement', formatNaira(entries.filter((entry) => entry.status === 'PENDING_SETTLEMENT').reduce((sum, entry) => sum + entry.amount, 0)), 'No money has moved', 'clock', 'amber'],
      ['Calculated entries', String(entries.length), 'Rule snapshots preserved', 'receipt', 'blue'],
      ['Completed orders', String(new Set(entries.map((entry) => entry.orderId)).size), 'With order-linked demo earnings', 'check', 'green']
    ] : meta.stats;
    const calculatedRows = entries.map((entry) => {
      const roleLabel = entry.role === 'vendor' ? 'Vendor earning' : 'Rider earning';
      const method = entry.model === 'percentage' ? `${entry.rate}%` : entry.model === 'fixed' ? formatNaira(entry.fixedAmount) : 'Set per request';
      return `<tr><td><div class="table-person"><span class="table-avatar">${escapeHTML(initials(entry.beneficiaryName))}</span><span><strong>${escapeHTML(entry.id)}</strong><small>${escapeHTML(roleLabel)} · ${escapeHTML(entry.orderId)} · ${escapeHTML(entry.ruleName)}</small></span></div></td><td><span class="basis-label">${escapeHTML(entry.beneficiaryName)}</span><small class="ledger-basis-detail">${escapeHTML(BASIS_LABELS[entry.basis] || entry.basis)} · ${formatNaira(entry.basisAmount)} base · ${escapeHTML(method)}</small></td><td><span class="rate-primary">+${formatNaira(entry.amount)}</span><small class="ledger-basis-detail">Pending · no transfer</small></td><td><span class="badge badge-amber">Pending settlement</span></td><td><button class="icon-action" type="button" aria-label="View ${escapeAttr(entry.id)} details" data-action="open-ledger-entry" data-id="${escapeAttr(entry.id)}">${icon('arrow-right')}</button></td></tr>`;
    }).join('');
    const sampleRows = meta.rows.map((row) => `<tr><td><div class="table-person"><span class="table-avatar">${escapeHTML(row.initials || initials(row.name))}</span><span><strong>${escapeHTML(row.name)}</strong><small>${escapeHTML(row.detail)}</small></span></div></td><td><span class="basis-label">${escapeHTML(row.area)}</span></td><td><span class="rate-primary">${escapeHTML(row.amount)}</span></td><td><span class="badge badge-${escapeAttr(row.badge || 'gray')}">${escapeHTML(row.status)}</span></td><td><button class="icon-action" type="button" aria-label="Open ${escapeAttr(row.name)} details" data-action="record-info" data-name="${escapeAttr(row.name)}">${icon('arrow-right')}</button></td></tr>`).join('');
    const allRows = calculatedRows + sampleRows;
    const sectionCopy = entries.length ? 'New order-linked demo earnings appear first. They remain pending and do not change a wallet or initiate a payment.' : meta.sectionCopy;
    const buttons = `<button class="button button-secondary" type="button" data-action="module-help">${icon('info')}<span>Ledger guidance</span></button><button class="button button-primary" type="button" data-page="live-orders">${icon('activity')}<span>View completed orders</span></button>`;
    return `<div class="page module-page ledger-page">
      ${renderPageHeading(meta.title, meta.eyebrow, meta.description, buttons)}
      ${renderStatCards(entryStats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>${escapeHTML(meta.heroTitle)}</h2><p>${escapeHTML(meta.heroCopy)}${entries.length ? ' New browser-only earnings are calculated from saved rule snapshots and remain pending settlement.' : ''}</p></div><span class="module-hero-badge">${icon('wallet')}DEMO LEDGER · No transfers</span></div>
      <div class="module-content-grid"><section class="card"><div class="card-header"><div><h2 class="card-title">${escapeHTML(meta.sectionTitle)}</h2><p class="card-subtitle">${escapeHTML(sectionCopy)}</p></div><span class="badge badge-blue">${entries.length} order-linked demo line${entries.length === 1 ? '' : 's'}</span></div>
        <div class="table-scroll"><table class="module-table ledger-table"><thead><tr><th>Ledger entry</th><th>Beneficiary / base</th><th>Earning</th><th>Status</th><th><span class="sr-only">Open</span></th></tr></thead><tbody>${allRows}</tbody></table></div>
        <div class="table-foot"><span>Showing <strong>${entries.length + meta.rows.length}</strong> illustrative and order-linked records</span><span>Local snapshots · No bank movement</span></div>
      </section><aside class="card module-info-card"><h3>${escapeHTML(meta.sideTitle)}</h3><p>${escapeHTML(meta.sideCopy)}</p><div class="info-list">${meta.infoItems.map((item) => `<div class="info-list-item">${icon('check')}<span>${escapeHTML(item)}</span></div>`).join('')}</div><div class="rule-note ledger-safety-note">${icon('shield')}<span>New demo entries are pending settlement only. They are not withdrawable, posted to a wallet or evidence of a transfer.</span></div></aside></div>
    </div>`;
  }

  function moduleActionLabel(pageKey) {
    const labels = {
      'live-orders': 'Create test order', 'assignment-queue': 'Refresh queue', errands: 'Add category', vendors: 'Add partner', customers: 'Invite customer',
      riders: 'Add rider', applications: 'Assign reviewer', ledger: 'Export ledger', withdrawals: 'Review requests', reconciliation: 'Import statement',
      'order-forms': 'Create form', website: 'Edit draft', settings: 'Configure settings'
    };
    return labels[pageKey] || 'Add record';
  }

  function renderOverviewPage() {
    const meta = PAGE_META.overview;
    const tableRows = meta.rows.map((row) => `<tr><td><div class="table-person"><span class="table-avatar">${escapeHTML(row.initials)}</span><span><strong>${escapeHTML(row.name)}</strong><small>${escapeHTML(row.detail)}</small></span></div></td><td><span class="basis-label">${escapeHTML(row.area)}</span></td><td><span class="rate-primary">${escapeHTML(row.amount)}</span></td><td><span class="badge badge-${escapeAttr(row.badge)}">${escapeHTML(row.status)}</span></td><td><button class="icon-action" type="button" aria-label="Open ${escapeAttr(row.name)} details" data-action="record-info" data-name="${escapeAttr(row.name)}">${icon('arrow-right')}</button></td></tr>`).join('');
    return `<div class="page overview-page">
      ${renderPageHeading(meta.title, meta.eyebrow, meta.description, `<button class="button button-secondary" type="button" data-action="module-help">${icon('download')}<span>Download report</span></button><button class="button button-primary" type="button" data-page="live-orders">${icon('activity')}<span>View live orders</span></button>`)}
      ${renderStatCards(meta.stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>${escapeHTML(meta.heroTitle)}</h2><p>${escapeHTML(meta.heroCopy)}</p></div><span class="module-hero-badge">${icon('pin')}${escapeHTML(selectedLocation)} · Demo view</span></div>
      <div class="dashboard-bottom-grid"><section class="card"><div class="card-header"><div><h2 class="card-title">${escapeHTML(meta.sectionTitle)}</h2><p class="card-subtitle">${escapeHTML(meta.sectionCopy)}</p></div><button class="text-button" type="button" data-page="live-orders">All live orders ${icon('arrow-right')}</button></div><div class="table-scroll"><table class="module-table"><thead><tr><th>Order</th><th>Service area</th><th>Order total</th><th>Status</th><th><span class="sr-only">Open</span></th></tr></thead><tbody>${tableRows}</tbody></table></div><div class="table-foot"><span>Showing <strong>4</strong> of 284 active sample orders</span><span>Refreshed a moment ago</span></div></section>
        <section class="card"><div class="card-header"><div><h2 class="card-title">${escapeHTML(meta.sideTitle)}</h2><p class="card-subtitle">${escapeHTML(meta.sideCopy)}</p></div><button class="icon-action" type="button" aria-label="Service health details" data-action="module-help">${icon('more')}</button></div><div class="service-health-list">${meta.health.map(([name, val]) => `<div class="service-health-row"><span>${escapeHTML(name)}</span><span class="progress-track"><span class="progress-bar" style="display:block;width:${Number(val)}%"></span></span><strong>${Number(val)}%</strong></div>`).join('')}</div><div class="table-foot"><span>Completion rate by service</span><span>Last 7 days</span></div></section></div>
    </div>`;
  }

  function applicationStatusColor(status) {
    return status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'gray' : status === 'IN_REVIEW' ? 'blue' : status === 'INFO_REQUESTED' ? 'orange' : 'amber';
  }

  function filteredApplications() {
    const query = applicationSearch.trim().toLowerCase();
    return state.applications.filter((application) => {
      if (applicationFilter !== 'all' && application.status !== applicationFilter) return false;
      if (!query) return true;
      return [application.id, application.name, application.category, application.location, application.reviewer].join(' ').toLowerCase().includes(query);
    });
  }

  function renderApplicationRows() {
    return filteredApplications().map((application) => `<tr>
      <td><div class="table-person"><span class="table-avatar">${escapeHTML(initials(application.name))}</span><span><strong>${escapeHTML(application.name)}</strong><small>${escapeHTML(application.id)} · ${escapeHTML(application.category)}</small></span></div></td>
      <td><span class="basis-label">${escapeHTML(application.location)}</span></td>
      <td><span class="scope-label">${escapeHTML(application.submitted)}</span></td>
      <td><span class="scope-label">${escapeHTML(application.reviewer || 'Unassigned')}</span></td>
      <td><span class="badge badge-${applicationStatusColor(application.status)}">${escapeHTML(APPLICATION_STATUS_LABELS[application.status] || 'Submitted')}</span></td>
      <td><button class="button button-secondary order-open-button" type="button" data-action="open-application" data-id="${escapeAttr(application.id)}">Review ${icon('arrow-right')}</button></td>
    </tr>`).join('');
  }

  function renderApplicationsPage() {
    const apps = state.applications || [];
    const submitted = apps.filter((application) => application.status === 'SUBMITTED').length;
    const reviewing = apps.filter((application) => application.status === 'IN_REVIEW').length;
    const needsInfo = apps.filter((application) => application.status === 'INFO_REQUESTED').length;
    const decided = apps.filter((application) => ['APPROVED', 'REJECTED'].includes(application.status)).length;
    const stats = [
      ['Awaiting review', String(submitted), 'New applications', 'file', 'amber'],
      ['In review', String(reviewing), 'Assigned to a reviewer', 'shield', 'blue'],
      ['More information', String(needsInfo), 'Applicant follow-up needed', 'clock', 'orange'],
      ['Decided', String(decided), 'Approved or rejected', 'check', 'green']
    ];
    const filters = [
      ['all', 'All', apps.length], ['SUBMITTED', 'Submitted', submitted], ['IN_REVIEW', 'In review', reviewing],
      ['INFO_REQUESTED', 'Needs info', needsInfo], ['APPROVED', 'Approved', apps.filter((application) => application.status === 'APPROVED').length],
      ['REJECTED', 'Rejected', apps.filter((application) => application.status === 'REJECTED').length]
    ];
    const rows = renderApplicationRows();
    const buttons = `<button class="button button-secondary" type="button" data-action="application-guidance">${icon('shield')}<span>Review safeguards</span></button>`;
    return `<div class="page applications-page">
      ${renderPageHeading('Applications & KYC', 'PEOPLE / SECURE REVIEW', 'Review rider, fleet and vendor applications with clear assignment, decisions and access accountability. No sensitive identity files are shown in this demo.', buttons)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>Keep identity evidence private. Keep decisions accountable.</h2><p>Review provider results and document metadata without exposing raw NIN, BVN, guarantor details or verification media in ordinary dashboards.</p></div><span class="module-hero-badge">${icon('lock')}Protected evidence · demo metadata only</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">Application review queue</h2><p class="card-subtitle">Individual rider, company fleet and vendor decisions update linked sample provider approval. Evidence remains metadata-only.</p></div><span class="badge badge-blue">${apps.length} sample applications</span></div>
        <div class="application-toolbar"><div class="rule-filters application-filters" role="group" aria-label="Filter applications">${filters.map(([key, label, count]) => `<button class="filter-button ${applicationFilter === key ? 'active' : ''}" type="button" data-application-filter="${escapeAttr(key)}">${escapeHTML(label)} <span>${count}</span></button>`).join('')}</div><label class="search-field"><span class="sr-only">Search applications</span>${icon('search')}<input id="applicationSearch" type="search" placeholder="Search name, type or ID…" value="${escapeAttr(applicationSearch)}"></label></div>
        <div class="table-scroll"><table class="module-table applications-table"><thead><tr><th>Applicant / reference</th><th>Service area</th><th>Submitted</th><th>Reviewer</th><th>Status</th><th>Action</th></tr></thead><tbody id="applicationTableBody">${rows || '<tr><td colspan="6"><div class="empty-state">No applications match this filter.</div></td></tr>'}</tbody></table></div>
        <div class="table-foot"><span id="applicationCountFoot">Showing <strong>${filteredApplications().length}</strong> of ${apps.length} sample applications</span><span>Changes persist only in this browser</span></div>
      </section>
      <div class="rule-note">${icon('shield')}<span><strong>Production controls.</strong> Restrict evidence preview/download to assigned reviewers, record every access, configure retention/deletion, and require a second authorized reviewer for decisions where separation of duties applies.</span></div>
    </div>`;
  }

  function renderApplicationModal(applicationId) {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) return;
    const checklist = APPLICATION_CHECKLISTS[application.kind] || APPLICATION_CHECKLISTS.rider;
    const linkedApprovalNotes = state.providers.flatMap((provider) => {
      const notes = [];
      if (provider.applicationId === application.id) notes.push(`${provider.name} partner approval is ${provider.approved ? 'approved' : 'not approved'}`);
      if (provider.companyApplicationId === application.id) notes.push(`${provider.company} fleet approval for ${provider.name} is ${provider.companyApproved ? 'approved' : 'not approved'}`);
      return notes;
    });
    const linkedApprovalMessage = linkedApprovalNotes.length ? `<div class="application-provider-link">${icon('shield')}<span>${linkedApprovalNotes.map((note) => escapeHTML(note)).join(' · ')}. This local decision changes demo Assignment Queue eligibility only.</span></div>` : '';
    const checks = checklist.map((item, index) => `<label class="review-check-row"><input type="checkbox" data-action="application-check" data-id="${escapeAttr(application.id)}" data-index="${index}" ${application.checks[index] ? 'checked' : ''} ${application.status !== 'IN_REVIEW' ? 'disabled' : ''}><span>${escapeHTML(item)}</span></label>`).join('');
    const evidence = application.evidence.map((item, index) => `<div class="evidence-row"><span class="evidence-icon">${icon(item.status === 'Received' ? 'file' : 'clock')}</span><span class="evidence-copy"><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.status)} · sensitive content hidden</small></span><button class="text-button" type="button" data-action="evidence-metadata" data-id="${escapeAttr(application.id)}" data-evidence-index="${index}">View metadata</button></div>`).join('');
    const history = (application.history || []).slice().reverse().map((event) => `<div class="application-event"><span class="application-event-dot"></span><div><strong>${escapeHTML(event.title)}</strong><small>${escapeHTML(event.actor)} · ${escapeHTML(event.at)}</small>${event.note ? `<p>${escapeHTML(event.note)}</p>` : ''}</div></div>`).join('');
    const reviewers = ['KYC Reviewer', 'Operations Manager', 'Company Reviewer'];
    const allChecksComplete = checklist.length > 0 && checklist.every((_, index) => application.checks[index]);
    const terminal = ['APPROVED', 'REJECTED'].includes(application.status);
    let footerActions = '';
    if (application.status === 'SUBMITTED') footerActions = `<button class="button button-primary" type="button" data-action="start-application-review" data-id="${escapeAttr(application.id)}">${icon('check')}<span>Start review</span></button>`;
    else if (application.status === 'INFO_REQUESTED') footerActions = `<button class="button button-primary" type="button" data-action="application-resubmitted" data-id="${escapeAttr(application.id)}">${icon('file')}<span>Simulate applicant update</span></button>`;
    else if (application.status === 'IN_REVIEW') footerActions = `<button class="button button-secondary" type="button" data-action="application-request-info" data-id="${escapeAttr(application.id)}">Request info</button><button class="button button-secondary reject-button" type="button" data-action="application-reject" data-id="${escapeAttr(application.id)}">Reject</button><button class="button button-primary" type="button" data-action="application-approve" data-id="${escapeAttr(application.id)}" ${allChecksComplete && application.reviewer ? '' : 'disabled'}>${icon('check')}<span>Approve</span></button>`;
    else footerActions = `<span class="badge badge-${applicationStatusColor(application.status)}">${escapeHTML(APPLICATION_STATUS_LABELS[application.status])}</span>`;
    const noteField = application.status === 'IN_REVIEW' ? `<div class="form-field application-note-field"><label class="field-label" for="applicationDecisionNote">Reviewer note <small>required for decisions or requests</small></label><textarea id="applicationDecisionNote" class="textarea-control" rows="3" maxlength="500" placeholder="Record a concise, respectful decision note. Do not enter full ID numbers or unnecessary sensitive details."></textarea><div class="form-error">Add a short reviewer note before continuing.</div></div>` : application.lastNote ? `<div class="application-last-note"><strong>Last reviewer note</strong><p>${escapeHTML(application.lastNote)}</p></div>` : '';
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal application-modal" role="dialog" aria-modal="true" aria-labelledby="applicationModalTitle">
      <header class="modal-header"><div><div class="eyebrow">${escapeHTML(application.id)} <span class="eyebrow-separator">/</span> ${escapeHTML(application.category)}</div><h2 id="applicationModalTitle">Application review</h2><p>${escapeHTML(application.name)} · ${escapeHTML(application.location)} · Submitted ${escapeHTML(application.submitted)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="modal-body"><div class="application-summary"><div class="application-summary-main"><span class="application-avatar">${escapeHTML(initials(application.name))}</span><div><strong>${escapeHTML(application.name)}</strong><small>${escapeHTML(application.category)} · ${escapeHTML(application.location)}</small></div></div><span class="badge badge-${applicationStatusColor(application.status)}">${escapeHTML(APPLICATION_STATUS_LABELS[application.status])}</span></div>${linkedApprovalMessage}
        <div class="reviewer-assignment"><div><span class="field-label">Assigned reviewer</span><small>${application.reviewer ? escapeHTML(application.reviewer) : 'No reviewer assigned'}</small></div><div class="reviewer-assignment-controls"><select id="applicationReviewer" class="select-control" aria-label="Select an application reviewer" ${terminal ? 'disabled' : ''}>${reviewers.map((reviewer) => `<option ${reviewer === application.reviewer ? 'selected' : ''}>${escapeHTML(reviewer)}</option>`).join('')}</select><button class="button button-secondary order-open-button" type="button" data-action="assign-application-reviewer" data-id="${escapeAttr(application.id)}" ${terminal ? 'disabled' : ''}>Assign</button></div></div>
        <section class="review-section"><div class="review-section-heading"><div><h3>Evidence register</h3><p>Metadata only. No identity documents or verification media are exposed.</p></div><span class="badge badge-gray">${application.evidence.length} items</span></div><div class="evidence-list">${evidence}</div></section>
        <section class="review-section"><div class="review-section-heading"><div><h3>Review checklist</h3><p>${application.status === 'IN_REVIEW' ? 'Complete each applicable check before approval.' : 'Checklist is editable only while the case is in review.'}</p></div><span class="badge badge-${allChecksComplete ? 'green' : 'amber'}">${application.checks.filter(Boolean).length}/${checklist.length} complete</span></div><div class="review-checklist">${checks}</div></section>
        ${noteField}
        <section class="review-section review-history-section"><div class="review-section-heading"><div><h3>Decision history</h3><p>Local demo event timeline.</p></div></div><div class="application-history">${history || '<p class="field-help">No review events recorded.</p>'}</div></section>
        ${terminal ? '' : '<div class="application-privacy-note">Do not enter full NIN/BVN values, bank details or unnecessary third-party information in reviewer notes.</div>'}
      </div><footer class="modal-footer"><span class="modal-footer-note">${icon('lock')}${terminal ? 'Decision is final in this demo' : 'Sensitive file preview is not available'}</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button>${footerActions}</div></footer>
    </section></div>`;
  }

  function applicationEvent(application, title, note = '', actor = 'Operations Manager') {
    const at = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
    application.history = Array.isArray(application.history) ? application.history : [];
    application.history.push({ title, actor, at, note });
    application.history = application.history.slice(-30);
  }

  function updateApplicationCheck(input) {
    const application = state.applications.find((item) => item.id === input.dataset.id);
    const index = Number(input.dataset.index);
    if (!application || application.status !== 'IN_REVIEW' || !Number.isInteger(index) || index < 0 || index >= application.checks.length) return;
    const checked = Boolean(input.checked);
    if (application.checks[index] === checked) return;
    application.checks[index] = checked;
    const checklist = APPLICATION_CHECKLISTS[application.kind] || [];
    applicationEvent(application, 'Review checklist updated', `${checklist[index]} marked ${checked ? 'complete' : 'incomplete'}`);
    saveState();
    const complete = checklist.length > 0 && checklist.every((_, itemIndex) => application.checks[itemIndex]);
    const section = document.querySelectorAll('.review-section')[1];
    const badge = section?.querySelector('.review-section-heading .badge');
    if (badge) {
      badge.textContent = `${application.checks.filter(Boolean).length}/${checklist.length} complete`;
      badge.className = `badge badge-${complete ? 'green' : 'amber'}`;
    }
    const historyContainer = document.querySelector('.application-history');
    if (historyContainer) historyContainer.innerHTML = application.history.slice().reverse().map((entry) => `<div class="application-event"><span class="application-event-dot"></span><div><strong>${escapeHTML(entry.title)}</strong><small>${escapeHTML(entry.actor)} · ${escapeHTML(entry.at)}</small>${entry.note ? `<p>${escapeHTML(entry.note)}</p>` : ''}</div></div>`).join('');
    const approve = document.querySelector('[data-action="application-approve"]');
    if (approve) approve.disabled = !complete || !application.reviewer;
  }

  function openApplicationReview(applicationId) {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application) return;
    applicationEvent(application, 'Review record opened', '', 'Admin Owner (demo)');
    saveState();
    renderApplicationModal(applicationId);
  }

  function startApplicationReview(applicationId) {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application || application.status !== 'SUBMITTED') return;
    application.status = 'IN_REVIEW';
    if (!application.reviewer) application.reviewer = 'KYC Reviewer';
    applicationEvent(application, 'Review started', `Assigned to ${application.reviewer}`);
    syncProviderApplicationApprovals();
    saveState();
    render();
    renderApplicationModal(applicationId);
    toast('Application moved to review. This is a local demo state change.');
  }

  function setApplicationReviewer(applicationId) {
    const application = state.applications.find((item) => item.id === applicationId);
    const reviewer = document.getElementById('applicationReviewer')?.value;
    if (!application || !reviewer || ['APPROVED', 'REJECTED'].includes(application.status)) return;
    application.reviewer = reviewer;
    applicationEvent(application, 'Reviewer assigned', `Assigned to ${reviewer}`);
    saveState();
    render();
    renderApplicationModal(applicationId);
    toast(`${reviewer} assigned in this browser.`);
  }

  function completeApplicationReview(applicationId, action) {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application || application.status !== 'IN_REVIEW' || !['APPROVED', 'REJECTED', 'INFO_REQUESTED'].includes(action)) return;
    const noteInput = document.getElementById('applicationDecisionNote');
    const note = noteInput?.value.trim() || '';
    if (!note || /(?:\d[\s-]*){11}/.test(note)) {
      const field = noteInput?.closest('.form-field');
      field?.classList.add('has-error');
      const error = field?.querySelector('.form-error');
      if (error) error.textContent = note ? 'Do not enter NIN, BVN or other 11-digit identity numbers.' : 'Add a short reviewer note before continuing.';
      noteInput?.focus();
      return;
    }
    if (!application.reviewer) { toast('Assign an authorized reviewer before recording a decision.'); return; }
    if (action === 'APPROVED') {
      const requiredChecks = APPLICATION_CHECKLISTS[application.kind] || [];
      if (!requiredChecks.length || !requiredChecks.every((_, index) => application.checks[index])) {
        toast('Complete all review checklist items before approval.');
        return;
      }
    }
    const labels = { APPROVED: 'Application approved', REJECTED: 'Application rejected', INFO_REQUESTED: 'More information requested' };
    application.status = action;
    application.lastNote = note;
    applicationEvent(application, labels[action] || 'Application updated', note);
    syncProviderApplicationApprovals();
    saveState();
    render();
    renderApplicationModal(applicationId);
    toast(`${labels[action] || 'Application updated'} in this browser.`);
  }

  function simulateApplicationResubmission(applicationId) {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application || application.status !== 'INFO_REQUESTED') return;
    application.status = 'IN_REVIEW';
    application.lastNote = '';
    application.checks = APPLICATION_CHECKLISTS[application.kind].map(() => false);
    applicationEvent(application, 'Applicant update received (simulated)', 'No actual documents were uploaded.');
    syncProviderApplicationApprovals();
    saveState();
    render();
    renderApplicationModal(applicationId);
    toast('Returned to review. No document was uploaded or stored.');
  }

  function logEvidenceMetadata(applicationId, evidenceIndex) {
    const application = state.applications.find((item) => item.id === applicationId);
    const item = application?.evidence[evidenceIndex];
    if (!application || !item) return;
    applicationEvent(application, 'Evidence metadata accessed', item.label, 'Admin Owner (demo)');
    saveState();
    renderApplicationModal(applicationId);
    toast('Metadata access logged. Private file content is not available in this preview.');
  }

  function renderRolesPage() {
    const columns = [
      ['Operations Manager', 'Scoped operations'],
      ['KYC Reviewer', 'Sensitive review'],
      ['Finance Officer', 'Financial scope'],
      ['Fleet Dispatcher', 'Company scope']
    ];
    const permissions = Object.keys(DEFAULT_PERMISSIONS);
    const permissionRows = permissions.map((permission) => {
      const values = Array.isArray(state.permissions[permission]) ? state.permissions[permission] : DEFAULT_PERMISSIONS[permission];
      return `<tr><td><code>${escapeHTML(permission)}</code></td>${columns.map((_, index) => `<td><button class="permission-check" type="button" role="checkbox" aria-checked="${Boolean(values[index])}" aria-label="Toggle ${escapeAttr(permission)} for ${escapeAttr(columns[index][0])}" data-action="toggle-permission" data-permission="${escapeAttr(permission)}" data-role-index="${index}">${values[index] ? icon('check') : ''}</button></td>`).join('')}</tr>`;
    }).join('');
    const stats = [['Permission definitions', '42', 'Registered across modules', 'shield', 'green'], ['Built-in roles', '6', 'Platform-managed', 'users', 'blue'], ['Scoped company roles', '18', 'Within company limits', 'building', 'orange'], ['Root accounts', '1', 'Protected recovery process', 'lock', 'amber']];
    return `<div class="page roles-page">
      ${renderPageHeading('Roles & permissions', 'PEOPLE / ACCESS CONTROL', 'A central checklist for module actions. Backend endpoints must independently enforce permission, resource scope and separation of duties.', `<button class="button button-secondary" type="button" data-action="module-help">${icon('file')}<span>Permission registry</span></button><button class="button button-primary" type="button" data-action="role-help">${icon('plus')}<span>Create role</span></button>`)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>Checklist-based access, scoped to the resource</h2><p>Example role matrix for the platform. Company roles can only use permissions granted by ErrandX and remain restricted to their own company's riders, customers and transactions.</p></div><span class="module-hero-badge">${icon('shield')}Server-side enforcement required</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">Permission matrix</h2><p class="card-subtitle">Toggle cells in this prototype to preview a role configuration. Changes remain local to this browser.</p></div><span class="badge badge-amber">Illustrative only</span></div><div class="table-scroll"><table class="permission-table"><thead><tr><th>Permission key</th>${columns.map(([name, detail]) => `<th><span class="permission-role-header">${escapeHTML(name)}<small>${escapeHTML(detail)}</small></span></th>`).join('')}</tr></thead><tbody>${permissionRows}</tbody></table></div><div class="table-foot"><span>Role edits require <strong>roles.manage</strong> in production</span><button type="button" class="text-button" data-action="role-help">Read access-control notes ${icon('arrow-right')}</button></div></section>
      <div class="rule-note">${icon('shield')}<span><strong>Important:</strong> Hiding a button is not authorization. Every PHP endpoint must check the central permission registry, user's resource scope and any separation-of-duties policy. Audit role edits and sensitive access.</span></div>
    </div>`;
  }

  function featureItems() {
    return [
      ['errands', 'Errand marketplace', 'Accept new errand requests in enabled service areas.', 'package'],
      ['food', 'Restaurant ordering', 'Restaurant catalogue, menu and food checkout.', 'utensils'],
      ['smallChops', 'Small-chops marketplace', 'Vendor onboarding, listings and ordering.', 'store'],
      ['individualRiders', 'Individual rider applications', 'Allow new individual rider applications.', 'bike'],
      ['companyFleet', 'Company fleet applications', 'Allow new company and fleet applications.', 'building'],
      ['qrPickup', 'QR pickup verification', 'Offer an expiring QR pickup flow alongside code verification.', 'shield'],
      ['withdrawals', 'Rider withdrawals', 'Allow eligible partners to request a payout.', 'banknote'],
      ['companySalary', 'Company salary module', 'Enable authorized fleet compensation records.', 'wallet'],
      ['reviews', 'Customer reviews', 'Collect reviews after a completed order.', 'users'],
      ['promotions', 'Promotions & coupons', 'Allow approved campaign codes and discounts.', 'spark'],
      ['threeD', 'Website 3D animation', 'Show optimized 3D assets on supported devices.', 'globe'],
      ['videoKyc', 'Video verification sessions', 'Allow new liveness checks through an approved provider.', 'shield']
    ];
  }

  function renderFeaturesPage() {
    const stats = [['Registered controls', String(featureItems().length), 'Modules and feature flags', 'settings', 'green'], ['Available now', String(Object.values(state.features).filter(Boolean).length), 'Enabled in demo browser', 'check', 'blue'], ['Paused modules', String(Object.values(state.features).filter((value) => !value).length), 'Existing data is retained', 'clock', 'amber'], ['Emergency controls', 'Protected', 'Requires stronger authorization', 'shield', 'orange']];
    return `<div class="page features-page">
      ${renderPageHeading('Feature controls', 'PLATFORM / ROLLOUT', 'Enable or pause optional capabilities without bypassing authorization or removing financial and historical data.', `<button class="button button-secondary" type="button" data-action="feature-help">${icon('info')}<span>Control guidance</span></button>`)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>One registry for future-ready modules</h2><p>A feature flag controls availability only. It never grants access, changes past ledger entries or deletes orders. High-risk payment, payout and account-security controls should require stronger approval and a complete audit event.</p></div><span class="module-hero-badge">${icon('shield')}Feature availability ≠ permission</span></div>
      <div class="feature-grid">${featureItems().map(([key, name, description, symbol]) => `<article class="feature-card"><span class="feature-icon">${icon(symbol)}</span><div class="feature-copy"><strong>${escapeHTML(name)}</strong><p>${escapeHTML(description)}</p></div><button class="feature-toggle" type="button" role="switch" aria-checked="${Boolean(state.features[key])}" aria-label="${state.features[key] ? 'Pause' : 'Enable'} ${escapeAttr(name)}" data-action="toggle-feature" data-feature="${escapeAttr(key)}"></button></article>`).join('')}</div>
      <div class="rule-note">${icon('info')}<span><strong>Safe rollout:</strong> Add per-location eligibility, account-type access, limits and rollout status to each registered feature. Payment, withdrawal and account-security pause controls should be independently protected.</span></div>
    </div>`;
  }

  function renderAddStateModal() {
    const configured = new Set(state.coverage.map((item) => item.name));
    const available = NIGERIAN_STATES.filter((name) => !configured.has(name));
    const options = available.length ? available.map((name) => `<option value="${escapeAttr(name)}">${escapeHTML(name)}</option>`).join('') : '<option value="" selected>All Nigerian states are already configured</option>';
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="addStateTitle">
      <header class="modal-header"><div><div class="eyebrow">PLATFORM / COVERAGE</div><h2 id="addStateTitle">Add a Nigerian state</h2><p>Start a service-area configuration for another state or the Federal Capital Territory.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="modal-body"><div class="form-field"><label class="field-label" for="coverageStateChoice">State or territory</label><select id="coverageStateChoice" class="select-control" ${available.length ? '' : 'disabled'}>${options}</select></div><div class="coverage-data-note">${icon('info')}<span>State names use the Nigeria-wide catalog. LGAs and neighborhoods are entered as demo configuration; validate official administrative boundaries before production use.</span></div></div>
      <footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Browser-only demo</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="confirm-add-state" ${available.length ? '' : 'disabled'}>${icon('plus')}<span>Add state</span></button></div></footer>
    </section></div>`;
    document.getElementById('coverageStateChoice')?.focus();
  }

  function addCoverageState() {
    const name = document.getElementById('coverageStateChoice')?.value;
    if (!NIGERIAN_STATES.includes(name) || state.coverage.some((item) => item.name === name)) {
      toast('Choose a Nigerian state or territory that is not already configured.');
      return;
    }
    state.coverage.push({ name, lgas: [] });
    state.selectedCoverageState = name;
    state.selectedLga = '';
    addActivity('State coverage added', `${name} · No LGAs configured yet`, 'Coverage');
    saveState();
    closeModal();
    render();
    toast(`${name} added to this browser’s coverage configuration.`);
  }

  function renderLocationsPage() {
    const coverageState = state.coverage.find((item) => item.name === state.selectedCoverageState) || state.coverage[0];
    const lgas = coverageState?.lgas || [];
    const selected = lgas.find((item) => item.name === state.selectedLga) || null;
    const areas = selected?.areas || [];
    const lgaCount = state.coverage.reduce((sum, item) => sum + item.lgas.length, 0);
    const areaCount = state.coverage.reduce((sum, item) => sum + item.lgas.reduce((areaSum, lga) => areaSum + lga.areas.length, 0), 0);
    const stats = [
      ['States configured', String(state.coverage.length), 'Across Nigeria · demo config', 'map', 'green'],
      ['LGAs configured', String(lgaCount), 'Entered per service state', 'pin', 'blue'],
      ['Operational areas', String(areaCount), 'Neighborhood-level coverage', 'globe', 'orange'],
      ['Matching mode', 'Area-aware', 'No location tracking in this demo', 'activity', 'amber']
    ];
    const stateOptions = state.coverage.map((item) => `<option value="${escapeAttr(item.name)}" ${item.name === coverageState?.name ? 'selected' : ''}>${escapeHTML(item.name)}</option>`).join('');
    const lgaButtons = lgas.map((lga) => `<button class="${lga.name === selected?.name ? 'active' : ''}" type="button" data-action="select-lga" data-lga="${escapeAttr(lga.name)}">${escapeHTML(lga.name)}<small>${lga.areas.length} areas</small></button>`).join('');
    const areaChips = areas.map((area) => `<span class="area-chip">${icon('pin')}<span>${escapeHTML(area)}</span><button class="area-remove" type="button" data-action="remove-coverage-area" data-state="${escapeAttr(coverageState.name)}" data-lga="${escapeAttr(selected.name)}" data-area="${escapeAttr(area)}" aria-label="Remove ${escapeAttr(area)}">${icon('close')}</button></span>`).join('');
    const buttons = `<button class="button button-secondary" type="button" data-action="location-guidance">${icon('info')}<span>Matching rules</span></button><button class="button button-secondary" type="button" data-action="add-state">${icon('plus')}<span>Add state</span></button><button class="button button-primary" type="button" data-action="add-area" ${selected ? '' : 'disabled'}>${icon('plus')}<span>Add operational area</span></button>`;
    return `<div class="page locations-page">
      ${renderPageHeading('Location & service areas', 'PLATFORM / COVERAGE', 'Configure state, LGA and neighborhood coverage for Nigeria. Add service states as operations expand, then define the LGAs and areas riders can serve.', buttons)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>Start local. Expand without rebuilding.</h2><p>Use configured pickup areas to scope service availability. Production matching should also check partner approval, service type, online status and operational eligibility.</p></div><span class="module-hero-badge">${icon('pin')}${escapeHTML(selectedLocation)} · Configurable scope</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">Operational coverage</h2><p class="card-subtitle">Kano opens with illustrative neighborhoods. Add states and configure their LGAs locally.</p></div><span class="badge badge-green">${state.coverage.length} configured state${state.coverage.length === 1 ? '' : 's'}</span></div>
        <div class="location-panel coverage-panel"><aside class="location-panel-aside"><label for="coverageStateSelect">Configured state</label><div class="coverage-state-row"><select id="coverageStateSelect" class="select-control">${stateOptions}</select><button class="icon-action" type="button" data-action="add-state" aria-label="Add state">${icon('plus')}</button></div><div class="coverage-lga-heading"><label>Local government areas</label><button class="text-button" type="button" data-action="add-lga">Add LGA ${icon('plus')}</button></div><div class="location-list">${lgaButtons || '<p class="coverage-empty">No LGAs configured. Add one to start defining service neighborhoods.</p>'}</div></aside>
          <div class="location-area-content">${selected ? `<div class="coverage-area-heading"><div><h3>${escapeHTML(selected.name)} service areas</h3><p>${escapeHTML(coverageState.name)} · Providers may be matched to configured neighborhoods.</p></div><span class="badge badge-blue">${areas.length} area${areas.length === 1 ? '' : 's'}</span></div>${areaChips || '<p class="coverage-empty">No operational areas in this LGA yet. Add an area to define local coverage.</p>'}` : `<div class="coverage-empty coverage-empty-large">Select a state and add an LGA before configuring service areas.</div>`}<div class="rule-note coverage-guidance">${icon('info')}<span>The state selector covers all 36 states and the FCT; LGA and neighborhood entries are maintained here as demo data. Import and validate an authoritative Nigerian administrative-boundary dataset before live matching. This prototype does not request GPS access.</span></div></div>
        </div>
      </section>
    </div>`;
  }

  function renderRuleModal(ruleId = null) {
    const rule = state.rules.find((item) => item.id === ruleId) || null;
    const isEdit = Boolean(rule);
    const selectedType = rule ? rule.type : 'individual';
    const defaultServices = rule ? (rule.services || []) : ['Errands', 'Food delivery'];
    const defaultBasis = rule ? rule.basis : 'delivery_fee';
    const selectedModel = rule ? rule.model : 'percentage';
    const selectedBeneficiary = BENEFICIARIES.find((item) => item.type === selectedType) || BENEFICIARIES[0];
    const basisChoices = basisOptions(selectedType);
    const basisValue = basisChoices.some((item) => item.value === defaultBasis) ? defaultBasis : basisChoices[0].value;
    const body = `<form id="ruleForm" novalidate>
      <input type="hidden" name="id" value="${escapeAttr(rule ? rule.id : '')}">
      <div class="modal-form-grid">
        <div class="form-field"><label class="field-label" for="ruleType">Beneficiary type</label><select class="select-control" id="ruleType" name="type">${BENEFICIARIES.map((item) => `<option value="${escapeAttr(item.type)}" ${item.type === selectedType ? 'selected' : ''}>${escapeHTML(item.label)}</option>`).join('')}</select><div class="form-error">Choose a beneficiary type.</div></div>
        <div class="form-field"><label class="field-label" for="ruleScope">Applies to</label><input class="input-control" id="ruleScope" name="scope" type="text" maxlength="100" required value="${escapeAttr(rule ? rule.scope : selectedBeneficiary.defaultScope)}"><div class="field-help">Use an approved partner group or company scope.</div><div class="form-error">Enter a scope for this rule.</div></div>
        <div class="form-field form-span-2"><label class="field-label" for="ruleBasis">Earning calculation basis</label><select class="select-control" id="ruleBasis" name="basis">${basisChoices.map((item) => `<option value="${escapeAttr(item.value)}" ${item.value === basisValue ? 'selected' : ''}>${escapeHTML(item.label)}</option>`).join('')}</select><div class="field-help" id="basisHelp">${escapeHTML(BASIS_HELP[basisValue] || '')}</div></div>
        <div class="form-field form-span-2"><span class="field-label">Earning method</span><div class="mode-options" role="radiogroup" aria-label="Earning method">
          <label class="mode-option ${selectedModel === 'percentage' ? 'selected' : ''}"><input type="radio" name="model" value="percentage" ${selectedModel === 'percentage' ? 'checked' : ''}><span class="mode-radio"></span><strong>Percentage</strong><small>Share a percentage of the eligible base.</small></label>
          <label class="mode-option ${selectedModel === 'fixed' ? 'selected' : ''}"><input type="radio" name="model" value="fixed" ${selectedModel === 'fixed' ? 'checked' : ''}><span class="mode-radio"></span><strong>Custom amount</strong><small>Set a fixed amount per completed order.</small></label>
          <label class="mode-option ${selectedModel === 'per_request' ? 'selected' : ''}"><input type="radio" name="model" value="per_request" ${selectedModel === 'per_request' ? 'checked' : ''}><span class="mode-radio"></span><strong>Set per request</strong><small>An authorized operator enters a naira amount for each order.</small></label>
        </div></div>
        <div class="form-field form-span-2" id="ruleModeDetail">${renderModeDetail(selectedModel, rule)}</div>
        <div class="form-field form-span-2"><span class="field-label">Eligible services</span><div class="checkbox-group">${SERVICE_OPTIONS.map((service) => `<label class="checkbox-chip"><input type="checkbox" name="service" value="${escapeAttr(service)}" ${defaultServices.includes(service) ? 'checked' : ''}>${escapeHTML(service)}</label>`).join('')}</div><div class="form-error" id="serviceError">Select at least one service.</div></div>
        <div class="form-span-2 switch-line"><span class="switch-line-copy"><strong>Rule active</strong><small>Pausing a rule does not remove historical earnings or ledger entries.</small></span><button class="feature-toggle" type="button" role="switch" id="ruleActive" aria-checked="${rule ? Boolean(rule.active) : true}" aria-label="Toggle rule status"></button></div>
      </div>
    </form>`;
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header class="modal-header"><div><h2 id="modalTitle">${isEdit ? 'Edit earning rule' : 'Create earning rule'}</h2><p>${isEdit ? 'Update this beneficiary’s payout policy. Existing ledger entries remain unchanged.' : 'Choose who earns, how the amount is calculated and where the rule applies.'}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><div class="modal-body">${body}</div><footer class="modal-footer"><span class="modal-footer-note">${icon('lock')}Demo only · No live payouts are initiated</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="save-rule">${icon('check')}<span>${isEdit ? 'Save changes' : 'Create rule'}</span></button></div></footer></section></div>`;
    const dialog = document.querySelector('.modal');
    if (dialog) dialog.querySelector('select')?.focus();
    syncModalMode();
  }

  function defaultServicesForType(type) {
    if (type === 'company_rider') return ['Company dispatch'];
    if (type === 'restaurant') return ['Restaurant orders'];
    if (type === 'small_chops') return ['Small-chops orders'];
    return ['Errands', 'Food delivery'];
  }

  function basisOptions(type) {
    if (type === 'individual') return [
      { value: 'delivery_fee', label: 'Delivery / service fee' },
      { value: 'custom_base', label: 'Admin-set eligible amount' }
    ];
    if (type === 'company_rider') return [
      { value: 'rider_allocation', label: 'Company rider allocation' },
      { value: 'delivery_fee', label: 'Delivery / service fee' },
      { value: 'custom_base', label: 'Admin-set eligible amount' }
    ];
    return [
      { value: 'merchant_subtotal', label: 'Vendor item subtotal' },
      { value: 'custom_base', label: 'Admin-set eligible amount' }
    ];
  }

  function renderModeDetail(model, rule = null) {
    if (model === 'percentage') return `<div class="mode-detail"><label class="field-label" for="ruleRate">Payout percentage <small>0–100% of the eligible base</small></label><div class="input-with-prefix"><span>%</span><input class="input-control" id="ruleRate" name="rate" type="number" min="0" max="100" step="0.01" value="${escapeAttr(rule ? (Number(rule.rate) || 0) : '78')}" required inputmode="decimal"></div><div class="form-error">Enter a percentage from 0 to 100.</div></div>`;
    if (model === 'fixed') return `<div class="mode-detail"><label class="field-label" for="ruleAmount">Custom amount per completed order</label><div class="input-with-prefix"><span>₦</span><input class="input-control" id="ruleAmount" name="amount" type="number" min="0" step="50" value="${escapeAttr(rule ? (Number(rule.amount) || 0) : '1500')}" required inputmode="decimal"></div><div class="field-help">The settlement service should reject an amount above the available eligible base unless an authorized subsidy is recorded.</div><div class="form-error">Enter a valid non-negative naira amount.</div></div>`;
    return `<div class="mode-detail"><strong style="display:block;color:#55655a;font-size:9px">Amount set individually for each request</strong><p style="margin-top:5px;color:#8e9991;font-size:8px;line-height:1.5">No default payout is stored. An authorized operator enters the amount for the specific order. Production must validate the order, operator permission, available balance and any approval threshold.</p><input type="hidden" name="amount" value="0"><input type="hidden" name="rate" value="0"></div>`;
  }

  function syncModalMode() {
    const form = document.getElementById('ruleForm');
    if (!form) return;
    const selected = form.querySelector('input[name="model"]:checked');
    const model = selected ? selected.value : 'percentage';
    form.querySelectorAll('.mode-option').forEach((option) => {
      option.classList.toggle('selected', option.querySelector('input').value === model);
    });
    const oldDetail = document.getElementById('ruleModeDetail');
    const existingRule = state.rules.find((item) => item.id === form.elements.id.value) || null;
    if (oldDetail) oldDetail.innerHTML = renderModeDetail(model, existingRule && existingRule.model === model ? existingRule : null);
  }

  function updateBasisChoices(type) {
    const basis = document.getElementById('ruleBasis');
    const help = document.getElementById('basisHelp');
    if (!basis) return;
    const choices = basisOptions(type);
    const current = basis.value;
    basis.innerHTML = choices.map((item) => `<option value="${escapeAttr(item.value)}">${escapeHTML(item.label)}</option>`).join('');
    basis.value = choices.some((item) => item.value === current) ? current : choices[0].value;
    if (help) help.textContent = BASIS_HELP[basis.value] || '';
    const typeData = BENEFICIARIES.find((item) => item.type === type);
    const scopeInput = document.getElementById('ruleScope');
    if (typeData && scopeInput && !scopeInput.dataset.touched) {
      scopeInput.value = typeData.defaultScope;
    }
  }

  function validateRuleForm(form) {
    let valid = true;
    form.querySelectorAll('.form-field').forEach((field) => field.classList.remove('has-error'));
    const scope = form.elements.scope.value.trim();
    if (!scope) {
      form.elements.scope.closest('.form-field').classList.add('has-error');
      valid = false;
    }
    const model = form.querySelector('input[name="model"]:checked')?.value || 'percentage';
    if (model === 'percentage') {
      const field = document.getElementById('ruleRate')?.closest('.form-field');
      const rate = Number(document.getElementById('ruleRate')?.value);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) { field?.classList.add('has-error'); valid = false; }
    }
    if (model === 'fixed') {
      const field = document.getElementById('ruleAmount')?.closest('.form-field');
      const amount = Number(document.getElementById('ruleAmount')?.value);
      if (!Number.isFinite(amount) || amount < 0) { field?.classList.add('has-error'); valid = false; }
    }
    const serviceField = form.querySelector('input[name="service"]')?.closest('.form-field');
    if (form.querySelectorAll('input[name="service"]:checked').length === 0) {
      serviceField?.classList.add('has-error');
      const error = document.getElementById('serviceError');
      if (error) error.style.display = 'block';
      valid = false;
    } else {
      const error = document.getElementById('serviceError');
      if (error) error.style.display = 'none';
    }
    return valid;
  }

  function saveRule() {
    const form = document.getElementById('ruleForm');
    if (!form || !validateRuleForm(form)) {
      form?.querySelector('.form-field.has-error input, .form-field.has-error select')?.focus();
      return;
    }
    const id = form.elements.id.value || `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const type = form.elements.type.value;
    const beneficiary = (BENEFICIARIES.find((item) => item.type === type) || BENEFICIARIES[0]).label;
    const model = form.querySelector('input[name="model"]:checked')?.value || 'percentage';
    const prior = state.rules.find((item) => item.id === id);
    const rule = {
      id,
      type,
      beneficiary,
      scope: form.elements.scope.value.trim(),
      services: Array.from(form.querySelectorAll('input[name="service"]:checked')).map((input) => input.value),
      basis: form.elements.basis.value,
      model,
      rate: model === 'percentage' ? Number(document.getElementById('ruleRate').value) : 0,
      amount: model === 'fixed' ? Number(document.getElementById('ruleAmount').value) : 0,
      active: document.getElementById('ruleActive')?.getAttribute('aria-checked') === 'true',
      updated: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date())
    };
    const existing = state.rules.findIndex((item) => item.id === id);
    if (existing >= 0) state.rules[existing] = rule;
    else state.rules.unshift(rule);
    addActivity(prior ? 'Earnings rule updated' : 'Earnings rule created', `${beneficiary} · ${MODE_LABELS[model]}`, modeRateText(rule));
    saveState();
    closeModal();
    render();
    toast(prior ? 'Earning rule updated in this browser.' : 'Earning rule created in this browser.');
  }

  function exportRules() {
    const headers = ['Beneficiary', 'Scope', 'Services', 'Method', 'Rate / amount', 'Calculation basis', 'Status', 'Updated'];
    const rows = state.rules.map((rule) => [
      ruleTitle(rule), rule.scope || '', (rule.services || []).join('; '), MODE_LABELS[rule.model] || rule.model,
      rule.model === 'percentage' ? `${Number(rule.rate) || 0}%` : rule.model === 'fixed' ? `${Number(rule.amount) || 0} NGN` : 'Set per request',
      BASIS_LABELS[rule.basis] || rule.basis, rule.active ? 'Active' : 'Paused', rule.updated || ''
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'errandx-earning-rules-demo.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Demo earning rules exported as CSV.');
  }

  function toggleRule(id) {
    const rule = state.rules.find((item) => item.id === id);
    if (!rule) return;
    rule.active = !rule.active;
    rule.updated = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date());
    addActivity(rule.active ? 'Earnings rule activated' : 'Earnings rule paused', `${ruleTitle(rule)} · ${rule.scope}`, rule.active ? 'Active' : 'Paused');
    saveState();
    render();
    toast(`${ruleTitle(rule)} rule ${rule.active ? 'activated' : 'paused'}.`);
  }

  function bindPageInteractions() {
    if (activePage === 'earnings') {
      updatePreview();
      const search = document.getElementById('ruleSearch');
      if (search) search.addEventListener('input', () => {
        ruleSearch = search.value;
        const body = document.getElementById('ruleTableBody');
        if (body) body.innerHTML = renderRuleRows();
        const foot = document.querySelector('.table-foot');
        if (foot) foot.querySelector('span').innerHTML = `<strong>${filteredRules().length}</strong> rule${filteredRules().length === 1 ? '' : 's'} shown · Changes are stored in this browser`;
      });
      document.getElementById('previewRule')?.addEventListener('change', updatePreview);
      document.getElementById('previewBase')?.addEventListener('input', updatePreview);
      document.getElementById('previewManual')?.addEventListener('input', updatePreview);
    }
    if (activePage === 'applications') {
      const search = document.getElementById('applicationSearch');
      if (search) search.addEventListener('input', () => {
        applicationSearch = search.value;
        const body = document.getElementById('applicationTableBody');
        if (body) body.innerHTML = renderApplicationRows() || '<tr><td colspan="6"><div class="empty-state">No applications match this filter.</div></td></tr>';
        const foot = document.getElementById('applicationCountFoot');
        if (foot) foot.innerHTML = `Showing <strong>${filteredApplications().length}</strong> of ${state.applications.length} sample applications`;
      });
    }
    if (activePage === 'assignment-queue') {
      const search = document.getElementById('assignmentSearch');
      if (search) search.addEventListener('input', () => {
        assignmentSearch = search.value;
        const body = document.getElementById('assignmentTableBody');
        if (body) body.innerHTML = renderAssignmentRows() || '<tr><td colspan="6"><div class="empty-state">No matching assignments in this view.</div></td></tr>';
        const foot = document.getElementById('assignmentCountFoot');
        if (foot) foot.innerHTML = `Showing <strong>${filteredAssignmentQueue().length}</strong> of ${assignmentQueueItems().length} requests needing an assignment`;
      });
    }
    if (activePage === 'riders' || activePage === 'vendors') {
      const search = document.getElementById('providerDirectorySearch');
      if (search) search.addEventListener('input', () => {
        providerDirectorySearch = search.value;
        const body = document.getElementById('providerDirectoryBody');
        if (body) body.innerHTML = providerDirectoryRows(activePage) || '<tr><td colspan="6"><div class="empty-state">No providers match this view. Try another filter.</div></td></tr>';
        const foot = document.getElementById('providerCountFoot');
        if (foot) foot.innerHTML = `Showing <strong>${filteredProviders(activePage).length}</strong> of ${state.providers.filter((provider) => activePage === 'riders' ? ['individual_rider', 'company_rider'].includes(provider.type) : ['restaurant', 'small_chops'].includes(provider.type)).length} demo profiles`;
      });
    }
  }

  function closeModal() {
    const root = document.getElementById('modalRoot');
    if (root) root.innerHTML = '';
    providerDraft = null;
    providerCoverageLocationValue = '';
    providerCoverageAreaValue = '';
  }

  function toast(message) {
    const region = document.getElementById('toastRegion');
    if (!region) return;
    const item = document.createElement('div');
    item.className = 'toast';
    item.innerHTML = `${icon('check')}<span>${escapeHTML(message)}</span>`;
    region.appendChild(item);
    window.setTimeout(() => item.remove(), 3400);
  }

  function simpleTextModal(title, description, label, action, placeholder = '') {
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="simpleModalTitle"><header class="modal-header"><div><h2 id="simpleModalTitle">${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><div class="modal-body"><div class="form-field"><label class="field-label" for="simpleModalInput">${escapeHTML(label)}</label><input id="simpleModalInput" class="input-control" type="text" maxlength="70" placeholder="${escapeAttr(placeholder)}"><div class="form-error">Enter a value.</div></div><p class="field-help">This is a browser-only prototype. It does not change a live service.</p></div><footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Demo workspace</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="save-simple" data-save-action="${escapeAttr(action)}">${icon('check')}<span>Save</span></button></div></footer></section></div>`;
    document.getElementById('simpleModalInput')?.focus();
  }

  function infoMessage(action, button = null) {
    if (action === 'rule-help') {
      toast('Percentage = share of eligible base · Custom amount = fixed payout per completed order · Per request = operator enters an amount for that specific order.');
    } else if (action === 'audit-info') {
      toast('A production audit trail should record actor, permission, resource, before/after values and timestamp.');
    } else if (action === 'role-help') {
      toast('Production role edits require server-side RBAC, resource scopes and separation-of-duties checks.');
    } else if (action === 'feature-help') {
      toast('Feature flags change availability only; they never bypass role checks or remove financial history.');
    } else if (action === 'location-guidance') {
      toast('Match by structured state, LGA and operational area, then check approval, availability and service requirements.');
    } else if (action === 'form-guidance') {
      toast('Publish a new form version to preserve the existing schema for historical orders. Conditions should reference an earlier field.');
    } else if (action === 'application-guidance') {
      toast('Production review requires assigned reviewers, private evidence storage, access logs and server-side approval checks.');
    } else if (action === 'module-help') {
      toast('This screen uses sample data. Connect a secure server-side module before using it operationally.');
    } else if (action === 'module-view-all') {
      toast('All records in this prototype are illustrative sample data.');
    } else if (action === 'record-info') {
      toast(`${button?.dataset.name || 'Record'} · Sample record. No live customer or payment data is connected.`);
    } else if (action === 'module-action') {
      const page = button?.dataset.module || activePage;
      toast(`${moduleActionLabel(page)} is represented as a prototype action. No live record was created.`);
    } else {
      toast('This action is available in the prototype interface only.');
    }
  }

  function setPage(page, shouldPush = true) {
    if (!validPage(page)) page = 'earnings';
    closeModal();
    activePage = page;
    if (shouldPush && location.hash.slice(1) !== page) history.pushState({ page }, '', `#${page}`);
    closeMobileNav();
    render();
    const main = document.getElementById('mainContent');
    main?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeMobileNav() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarScrim')?.classList.remove('visible');
  }

  document.addEventListener('click', (event) => {
    const pageLink = event.target.closest('[data-page]');
    if (pageLink) {
      event.preventDefault();
      setPage(pageLink.dataset.page);
      return;
    }

    const providerFilterButton = event.target.closest('[data-provider-filter]');
    if (providerFilterButton) {
      providerDirectoryFilter = providerFilterButton.dataset.providerFilter;
      const main = document.getElementById('mainContent');
      if (main) main.innerHTML = renderProviderDirectoryPage(activePage);
      bindPageInteractions();
      return;
    }

    const assignmentFilterButton = event.target.closest('[data-assignment-filter]');
    if (assignmentFilterButton) {
      assignmentFilter = assignmentFilterButton.dataset.assignmentFilter;
      const main = document.getElementById('mainContent');
      if (main) main.innerHTML = renderAssignmentQueuePage();
      bindPageInteractions();
      return;
    }

    const applicationFilterButton = event.target.closest('[data-application-filter]');
    if (applicationFilterButton) {
      applicationFilter = applicationFilterButton.dataset.applicationFilter;
      const main = document.getElementById('mainContent');
      if (main) main.innerHTML = renderApplicationsPage();
      bindPageInteractions();
      return;
    }

    const filter = event.target.closest('[data-rule-filter]');
    if (filter) {
      activeFilter = filter.dataset.ruleFilter;
      const main = document.getElementById('mainContent');
      if (main) main.innerHTML = renderEarningsPage();
      bindPageInteractions();
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === 'edit-provider-settings') { renderProviderSettingsModal(actionButton.dataset.id); return; }
      if (action === 'add-provider-draft-scope') { addProviderDraftScope(); return; }
      if (action === 'remove-provider-draft-scope') { removeProviderDraftScope(actionButton.dataset.state, actionButton.dataset.lga, actionButton.dataset.area); return; }
      if (action === 'save-provider-settings') { saveProviderSettings(); return; }
      if (action === 'open-assignment') { renderAssignmentModal(actionButton.dataset.id); return; }
      if (action === 'send-assignment-offer') { sendAssignmentOffer(actionButton.dataset.id, actionButton.dataset.providerId); return; }
      if (action === 'assignment-response') { respondToAssignment(actionButton.dataset.id, actionButton.dataset.response); return; }
      if (action === 'add-test-vendor-order') { addTestVendorOrder(); return; }
      if (action === 'open-application') { openApplicationReview(actionButton.dataset.id); return; }
      if (action === 'start-application-review') { startApplicationReview(actionButton.dataset.id); return; }
      if (action === 'assign-application-reviewer') { setApplicationReviewer(actionButton.dataset.id); return; }
      if (action === 'application-request-info') { completeApplicationReview(actionButton.dataset.id, 'INFO_REQUESTED'); return; }
      if (action === 'application-approve') { completeApplicationReview(actionButton.dataset.id, 'APPROVED'); return; }
      if (action === 'application-reject') { completeApplicationReview(actionButton.dataset.id, 'REJECTED'); return; }
      if (action === 'application-resubmitted') { simulateApplicationResubmission(actionButton.dataset.id); return; }
      if (action === 'evidence-metadata') { logEvidenceMetadata(actionButton.dataset.id, Number(actionButton.dataset.evidenceIndex)); return; }
      if (action === 'new-rule') { renderRuleModal(); return; }
      if (action === 'open-order') { renderOrderModal(actionButton.dataset.id); return; }
      if (action === 'add-test-order') { addTestOrder(); return; }
      if (action === 'transition-order') { transitionOrder(actionButton.dataset.id, actionButton.dataset.next); return; }
      if (action === 'calculate-order-earnings') { renderOrderEarningsModal(actionButton.dataset.id); return; }
      if (action === 'save-order-earnings') { saveOrderEarnings(); return; }
      if (action === 'open-ledger-entry') { renderLedgerEntryModal(actionButton.dataset.id); return; }
      if (action === 'new-form') { renderNewFormModal(); return; }
      if (action === 'save-new-form') { saveNewForm(); return; }
      if (action === 'edit-form') { editingFormId = actionButton.dataset.id; closeModal(); render(); return; }
      if (action === 'close-form-editor') { editingFormId = null; closeModal(); render(); return; }
      if (action === 'add-form-field') { renderFormFieldModal(actionButton.dataset.formId); return; }
      if (action === 'edit-form-field') { renderFormFieldModal(actionButton.dataset.formId, actionButton.dataset.fieldId); return; }
      if (action === 'save-form-field') { saveFormField(); return; }
      if (action === 'move-form-field') { moveFormField(actionButton.dataset.formId, actionButton.dataset.fieldId, actionButton.dataset.direction); return; }
      if (action === 'remove-form-field') { removeFormField(actionButton.dataset.formId, actionButton.dataset.fieldId); return; }
      if (action === 'save-form-draft') { saveFormMetadata(false); return; }
      if (action === 'publish-form') { saveFormMetadata(true); return; }
      if (action === 'preview-form') { const form = state.forms.find((item) => item.id === actionButton.dataset.id); if (form) renderFormPreview(form); return; }
      if (action === 'show-form-history') { const form = state.forms.find((item) => item.id === actionButton.dataset.id); if (form) renderFormHistory(form); return; }
      if (action === 'preview-form-version') { const form = state.forms.find((item) => item.id === actionButton.dataset.id); if (form) { const version = Number(actionButton.dataset.version); const snapshot = form.published?.version === version ? form.published : form.history.find((item) => Number(item.version) === version); if (snapshot) renderFormPreview(form, snapshot); } return; }
      if (action === 'preview-submit') { toast('Preview only. The form was not submitted and no response was stored.'); return; }
      if (action === 'edit-rule') { renderRuleModal(actionButton.dataset.id); return; }
      if (action === 'toggle-rule') { toggleRule(actionButton.dataset.id); return; }
      if (action === 'export-rules') { exportRules(); return; }
      if (action === 'close-modal') { closeModal(); return; }
      if (action === 'modal-backdrop-close' && event.target === actionButton) { closeModal(); return; }
      if (action === 'save-rule') { saveRule(); return; }
      if (action === 'save-simple') { saveSimple(actionButton.dataset.saveAction); return; }
      if (action === 'toggle-feature') { toggleFeature(actionButton.dataset.feature); return; }
      if (action === 'toggle-permission') { togglePermission(actionButton.dataset.permission, Number(actionButton.dataset.roleIndex)); return; }
      if (action === 'add-state') { renderAddStateModal(); return; }
      if (action === 'confirm-add-state') { addCoverageState(); return; }
      if (action === 'add-lga') {
        const coverageState = state.coverage.find((item) => item.name === state.selectedCoverageState);
        if (!coverageState) { toast('Select a configured state first.'); return; }
        simpleTextModal(`Add an LGA · ${coverageState.name}`, 'Enter a local government area for this state. Validate names against an authoritative boundary dataset before live use.', 'LGA name', 'lga', 'e.g. Ikeja');
        return;
      }
      if (action === 'add-area') {
        const coverageState = state.coverage.find((item) => item.name === state.selectedCoverageState);
        const selectedLga = coverageState?.lgas.find((item) => item.name === state.selectedLga);
        if (!coverageState || !selectedLga) { toast('Add or select an LGA before adding a service area.'); return; }
        simpleTextModal(`Add an area · ${selectedLga.name}`, `Add an operational neighborhood under ${selectedLga.name}, ${coverageState.name}. This change is stored in this browser only.`, 'Operational area', 'area', 'e.g. Central Market');
        return;
      }
      if (action === 'remove-coverage-area') { removeCoverageArea(actionButton.dataset.state, actionButton.dataset.lga, actionButton.dataset.area); return; }
      if (action === 'select-lga') {
        const coverageState = state.coverage.find((item) => item.name === state.selectedCoverageState);
        if (!coverageState?.lgas.some((item) => item.name === actionButton.dataset.lga)) return;
        state.selectedLga = actionButton.dataset.lga;
        saveState();
        render();
        return;
      }
      if (['module-help', 'module-view-all', 'record-info', 'module-action', 'rule-help', 'audit-info', 'role-help', 'feature-help', 'location-guidance', 'form-guidance', 'application-guidance'].includes(action)) { infoMessage(action, actionButton); return; }
    }

    const locationOpt = event.target.closest('[data-location]');
    if (locationOpt) {
      selectedLocation = locationOpt.dataset.location;
      state.location = selectedLocation;
      saveState();
      document.getElementById('locationPopover').hidden = true;
      document.getElementById('locationButton').setAttribute('aria-expanded', 'false');
      document.querySelectorAll('.popover-option').forEach((option) => option.classList.toggle('selected', option.dataset.location === selectedLocation));
      updateTopbar();
      if (activePage === 'overview' || activePage === 'locations') render();
      toast(`Operating view changed to ${selectedLocation}.`);
      return;
    }

    if (!event.target.closest('.location-wrapper')) {
      document.getElementById('locationPopover').hidden = true;
      document.getElementById('locationButton')?.setAttribute('aria-expanded', 'false');
    }
    if (event.target.closest('#locationButton')) {
      const popover = document.getElementById('locationPopover');
      const button = document.getElementById('locationButton');
      popover.hidden = !popover.hidden;
      button.setAttribute('aria-expanded', String(!popover.hidden));
      return;
    }
    if (event.target.closest('#notificationButton')) {
      toast('You’re all caught up. Notifications in this prototype are sample-only.');
      return;
    }
    if (event.target.closest('#profileButton')) {
      toast('Root account · Use a protected recovery process and MFA for production.');
      return;
    }
    if (event.target.closest('#menuToggle')) {
      document.getElementById('sidebar')?.classList.toggle('open');
      document.getElementById('sidebarScrim')?.classList.toggle('visible');
      return;
    }
    if (event.target.closest('#sidebarScrim')) closeMobileNav();
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('#ruleType')) {
      updateBasisChoices(event.target.value);
      const defaults = defaultServicesForType(event.target.value);
      document.querySelectorAll('#ruleForm input[name="service"]').forEach((input) => {
        input.checked = defaults.includes(input.value);
      });
      return;
    }
    if (event.target.matches('input[name="model"]')) {
      syncModalMode();
      return;
    }
    if (event.target.matches('#ruleBasis')) {
      const help = document.getElementById('basisHelp');
      if (help) help.textContent = BASIS_HELP[event.target.value] || '';
      return;
    }
    if (event.target.matches('#fieldType')) {
      syncFieldModalType();
      return;
    }
    if (event.target.matches('#coverageStateSelect')) {
      const coverageState = state.coverage.find((item) => item.name === event.target.value);
      if (coverageState) {
        state.selectedCoverageState = coverageState.name;
        state.selectedLga = coverageState.lgas[0]?.name || '';
        saveState();
        render();
      }
      return;
    }
    if (event.target.matches('[data-action="application-check"]')) {
      updateApplicationCheck(event.target);
      return;
    }
    if (event.target.matches('[data-preview-key]')) refreshFormPreviewConditions();
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('#applicationDecisionNote')) event.target.closest('.form-field')?.classList.remove('has-error');
    if (event.target.matches('#ruleScope')) event.target.dataset.touched = 'true';
    if (event.target.matches('#fieldLabel')) {
      const keyInput = document.getElementById('fieldKey');
      if (keyInput && !keyInput.dataset.touched) keyInput.value = slugifyFieldKey(event.target.value);
    }
    if (event.target.matches('#fieldKey')) event.target.dataset.touched = 'true';
    if (event.target.matches('[data-preview-key]')) refreshFormPreviewConditions();
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('#ruleActive')) {
      const button = event.target.closest('#ruleActive');
      const active = button.getAttribute('aria-checked') === 'true';
      button.setAttribute('aria-checked', String(!active));
    }
  });

  function saveSimple(action) {
    const input = document.getElementById('simpleModalInput');
    const name = input?.value.trim().replace(/\s+/g, ' ') || '';
    const field = input?.closest('.form-field');
    const reject = (message) => {
      field?.classList.add('has-error');
      const error = field?.querySelector('.form-error');
      if (error) error.textContent = message;
      input?.focus();
    };
    if (!input || !name) { reject('Enter a value.'); return; }

    const coverageState = state.coverage.find((item) => item.name === state.selectedCoverageState);
    if (action === 'lga') {
      if (!coverageState) { toast('Select a configured state before adding an LGA.'); return; }
      if (coverageState.lgas.some((item) => item.name.toLowerCase() === name.toLowerCase())) { reject('This LGA is already configured for the selected state.'); return; }
      coverageState.lgas.push({ name, areas: [] });
      state.selectedLga = name;
      addActivity('LGA added', `${name} · ${coverageState.name}`, 'Coverage');
    } else if (action === 'area') {
      const selectedLga = coverageState?.lgas.find((item) => item.name === state.selectedLga);
      if (!coverageState || !selectedLga) { toast('Select a configured LGA before adding an operational area.'); return; }
      if (selectedLga.areas.some((item) => item.toLowerCase() === name.toLowerCase())) { reject('This operational area is already listed for the selected LGA.'); return; }
      selectedLga.areas.push(name);
      addActivity('Service area added', `${name} · ${selectedLga.name}, ${coverageState.name}`, 'Coverage');
    } else {
      return;
    }
    saveState();
    closeModal();
    render();
    toast(`${name} added to this browser’s coverage configuration.`);
  }

  function removeCoverageArea(stateName, lgaName, areaName) {
    const coverageState = state.coverage.find((item) => item.name === stateName);
    const lga = coverageState?.lgas.find((item) => item.name === lgaName);
    if (!lga) return;
    const index = lga.areas.indexOf(areaName);
    if (index === -1) return;
    lga.areas.splice(index, 1);
    state.providers = providersWithApplicationApprovals(normalizeSavedProviders(state.providers, state.coverage), state.applications);
    addActivity('Service area removed', `${areaName} · ${lga.name}, ${coverageState.name}`, 'Coverage');
    saveState();
    render();
    toast(`${areaName} removed from this browser’s demo coverage.`);
  }

  function toggleFeature(key) {
    if (!Object.prototype.hasOwnProperty.call(state.features, key)) return;
    state.features[key] = !state.features[key];
    saveState();
    render();
    const item = featureItems().find((feature) => feature[0] === key);
    toast(`${item ? item[1] : 'Feature'} ${state.features[key] ? 'enabled' : 'paused'} in this browser.`);
  }

  function togglePermission(permission, roleIndex) {
    if (!Array.isArray(state.permissions[permission])) state.permissions[permission] = [...(DEFAULT_PERMISSIONS[permission] || [false, false, false, false])];
    if (!Number.isInteger(roleIndex) || roleIndex < 0 || roleIndex > 3) return;
    state.permissions[permission][roleIndex] = !state.permissions[permission][roleIndex];
    saveState();
    render();
    toast('Permission matrix updated locally. No server-side access was changed.');
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeMobileNav();
      document.getElementById('locationPopover').hidden = true;
      document.getElementById('locationButton')?.setAttribute('aria-expanded', 'false');
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.getElementById('ruleSearch')?.focus();
    }
  });

  window.addEventListener('popstate', () => {
    const requested = location.hash.slice(1);
    activePage = validPage(requested) ? requested : 'earnings';
    closeMobileNav();
    render();
  });

  render();
})();
