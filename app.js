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
    { id: 'EX-20479', workflow: 'errand', state: 'REQUESTED', service: 'Document errand', customer: 'Musa Sani', provider: 'Awaiting eligible rider', rider: 'Unassigned', area: 'Kano Municipal', total: 3200, created: '10:52 AM', history: [{ state: 'REQUESTED', actor: 'Customer', at: '10:52 AM' }] },
    { id: 'EX-20475', workflow: 'vendor', state: 'PREPARING', service: 'Small-chops order', customer: 'Zainab Yusuf', provider: 'Zee Small Chops', rider: 'Pending fleet assignment', area: 'Tarauni, Kano', total: 12800, created: '10:32 AM', history: [
      { state: 'REQUESTED', actor: 'Customer', at: '10:32 AM' }, { state: 'VENDOR_ACCEPTED', actor: 'Zee Small Chops', at: '10:35 AM' }, { state: 'PAYMENT_VERIFIED', actor: 'Payment service (demo)', at: '10:37 AM' }, { state: 'PREPARING', actor: 'Zee Small Chops', at: '10:39 AM' }
    ] },
    { id: 'EX-20472', workflow: 'errand', state: 'PICKUP_VERIFIED', service: 'Market pickup', customer: 'Ibrahim Ali', provider: 'Individual rider', rider: 'Halima Ibrahim', area: 'Fagge, Kano', total: 5600, created: '10:01 AM', history: [
      { state: 'REQUESTED', actor: 'Customer', at: '10:01 AM' }, { state: 'PROVIDER_ACCEPTED', actor: 'Halima Ibrahim', at: '10:04 AM' }, { state: 'PAYMENT_VERIFIED', actor: 'Payment service (demo)', at: '10:07 AM' }, { state: 'PICKUP_VERIFIED', actor: 'Rider (demo)', at: '10:12 AM' }
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
      sectionTitle: 'Review queue', sectionCopy: 'Only assigned reviewers can see protected KYC evidence.',
      heroTitle: 'Human review with clear accountability', heroCopy: 'Application decisions are separate from company and fleet setup. Every sensitive file preview, download and decision should produce an audit event.',
      rows: [
        { name: 'Mariya Adamu', initials: 'MA', detail: 'Individual rider · Submitted 2h ago', area: 'Kano Municipal', amount: '4 documents', status: 'Ready to review', badge: 'amber' },
        { name: 'Northline Logistics', initials: 'NL', detail: 'Company fleet · Submitted yesterday', area: 'Nassarawa, Kano', amount: '6 documents', status: 'More info needed', badge: 'orange' },
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
        { name: 'LG-006824', initials: 'LG', detail: 'Rider earning · EX-20472', area: 'Halima Ibrahim', amount: '+₦3,900', status: 'Posted', badge: 'green' },
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
      forms: structuredCloneSafe(DEFAULT_FORMS),
      features: { ...DEFAULT_FEATURES },
      permissions: structuredCloneSafe(DEFAULT_PERMISSIONS),
      customAreas: [],
      location: 'Kano State',
      activities: []
    };
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
            history: Array.isArray(order.history) ? order.history.filter((entry) => entry && ORDER_STEPS[workflow].includes(entry.state)).slice(-20) : []
          };
        });
      }
      if (Array.isArray(saved.forms)) initial.forms = saved.forms.filter((form) => form && typeof form === 'object' && typeof form.id === 'string').slice(0, 100).map(normalizeSavedForm);
      if (saved.features && typeof saved.features === 'object') initial.features = { ...initial.features, ...saved.features };
      if (saved.permissions && typeof saved.permissions === 'object') initial.permissions = { ...initial.permissions, ...saved.permissions };
      if (Array.isArray(saved.customAreas)) initial.customAreas = saved.customAreas.filter((area) => typeof area === 'string').slice(0, 100);
      if (typeof saved.location === 'string') initial.location = saved.location;
      if (Array.isArray(saved.activities)) initial.activities = saved.activities.slice(0, 10);
    } catch (_) {
      // A fresh, usable prototype is more important than a stale or malformed local setting.
    }
    return initial;
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
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
    return 'Amount entered at assignment';
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
    else if (activePage === 'order-forms') main.innerHTML = renderFormsPage();
    else if (activePage === 'features') main.innerHTML = renderFeaturesPage();
    else if (activePage === 'roles') main.innerHTML = renderRolesPage();
    else if (activePage === 'locations') main.innerHTML = renderLocationsPage();
    else if (activePage === 'overview') main.innerHTML = renderOverviewPage();
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
    const buttons = `<button class="button button-secondary" type="button" data-action="export-rules">${icon('download')}<span>Export rules</span></button><button class="button button-primary" type="button" data-action="new-rule">${icon('plus')}<span>New earning rule</span></button>`;
    const stats = [
      ['Partner earnings · MTD', '₦14.82m', '12.6% vs. last month', 'banknote', 'orange'],
      ['Pending settlement', '₦684,200', '42 completed orders', 'clock', 'amber'],
      ['Average partner share', '82.4%', 'Across completed orders', 'chart', 'blue'],
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
        <td><div class="rate-primary">${escapeHTML(modeRateText(rule))}</div><div class="rate-secondary">${escapeHTML(rule.model === 'percentage' ? 'of eligible base' : rule.model === 'fixed' ? 'per completed order' : 'set before assignment')}</div></td>
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
    return `<section class="card activity-card"><div class="activity-head"><div><h2 class="card-title">Recent rule activity</h2><p class="card-subtitle">Illustrative entries · new edits in this browser appear here.</p></div><button type="button" class="text-button" data-action="audit-info">View audit trail ${icon('arrow-right')}</button></div><div class="activity-list">${activities.map((item) => `<div class="activity-row"><span class="activity-icon">${icon('shield')}</span><div class="activity-main"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small></div><strong class="activity-amount">${escapeHTML(item.amount || '')}</strong><span class="activity-time">${escapeHTML(item.time || '')}</span></div>`).join('')}</div></section>`;
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
    const settlementCopy = order.state === 'COMPLETED'
      ? 'A production ledger settlement would be created only after verified completion. No money moved in this demo.'
      : 'Partner earnings remain unavailable until completion and payment reconciliation.';
    document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop-close"><section class="modal order-modal" role="dialog" aria-modal="true" aria-labelledby="orderModalTitle">
      <header class="modal-header"><div><div class="eyebrow">${escapeHTML(order.id)} <span class="eyebrow-separator">/</span> ${escapeHTML(order.service)}</div><h2 id="orderModalTitle">Order workflow</h2><p>${escapeHTML(order.customer)} · ${escapeHTML(order.area)} · ${formatNaira(order.total)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="modal-body">
        <div class="order-current-state"><div><span class="field-label">CURRENT STATE</span><strong>${escapeHTML(ORDER_STATE_LABELS[order.state] || order.state)}</strong><small>${escapeHTML(order.provider)}${order.rider && order.rider !== 'Unassigned' ? ` · ${escapeHTML(order.rider)}` : ''}</small></div><span class="badge badge-${orderBadgeColor(order.state)}">${escapeHTML(order.workflow === 'vendor' ? 'Vendor order' : 'Errand')}</span></div>
        <div class="order-timeline-wrap"><div class="timeline-heading"><h3>Allowed progression</h3><span>${history.length} event${history.length === 1 ? '' : 's'} recorded locally</span></div><ol class="order-timeline">${steps}</ol></div>
        <div class="order-settlement-note">${icon('wallet')}<span><strong>Settlement guard</strong>${escapeHTML(settlementCopy)}</span></div>
        ${latest ? `<p class="order-last-event">Last event: ${escapeHTML(ORDER_STATE_LABELS[latest.state] || latest.state)} · ${escapeHTML(latest.actor || 'Recorded')} · ${escapeHTML(latest.at || '')}</p>` : ''}
      </div>
      <footer class="modal-footer"><span class="modal-footer-note">${icon('info')}Local simulation · No credentials or payments are verified</span><div class="modal-footer-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button>${nextButton}</div></footer>
    </section></div>`;
  }

  function transitionOrder(orderId, requestedState) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || orderNextState(order) !== requestedState) {
      toast('That order transition is not allowed from the current state.');
      return;
    }
    order.state = requestedState;
    const actor = requestedState === 'PAYMENT_VERIFIED' ? 'Payment service (simulated)' :
      requestedState === 'VENDOR_ACCEPTED' || requestedState === 'PREPARING' || requestedState === 'READY_FOR_PICKUP' ? order.provider :
      requestedState === 'PROVIDER_ACCEPTED' ? 'Eligible provider (simulated)' :
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
      area: selectedLocation === 'All locations' ? 'Kano Municipal' : selectedLocation,
      total: 3200,
      created: at,
      history: [{ state: 'REQUESTED', actor: 'Customer (simulated)', at }]
    };
    state.orders.unshift(order);
    saveState();
    render();
    renderOrderModal(order.id);
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

  const LGA_LIST = [
    { name: 'Kano Municipal', areas: ['Central Market', 'Fagge', 'Kofar Mata', 'Sabon Gari'] },
    { name: 'Nassarawa', areas: ['Bompai', 'Hotoro', 'Giginyu', 'Tudun Wada'] },
    { name: 'Tarauni', areas: ['Gyadi-Gyadi', 'Unguwa Uku', 'Ja’en'] },
    { name: 'Gwale', areas: ['Dorayi', 'Goron Dutse', 'Dandago'] }
  ];

  function renderLocationsPage() {
    const selectedLga = state.selectedLga || 'Kano Municipal';
    const selected = LGA_LIST.find((item) => item.name === selectedLga) || LGA_LIST[0];
    const allAreas = [...selected.areas, ...state.customAreas];
    const stats = [['States configured', '1', 'Nigeria coverage can expand', 'map', 'green'], ['LGAs enabled', '4', 'Kano State · sample data', 'pin', 'blue'], ['Operational areas', String(LGA_LIST.reduce((sum, lga) => sum + lga.areas.length, 0) + state.customAreas.length), 'Specific neighborhoods', 'globe', 'orange'], ['Matching mode', 'Area-aware', 'GPS is optional and transparent', 'activity', 'amber']];
    return `<div class="page locations-page">
      ${renderPageHeading('Location & service areas', 'PLATFORM / COVERAGE', 'Configure Nigerian states, LGAs and operational neighborhoods used for rider eligibility and marketplace availability.', `<button class="button button-secondary" type="button" data-action="location-guidance">${icon('info')}<span>Matching rules</span></button><button class="button button-primary" type="button" data-action="add-area">${icon('plus')}<span>Add operational area</span></button>`)}
      ${renderStatCards(stats)}
      <div class="module-hero"><div class="module-hero-copy"><h2>Start local. Expand without rebuilding.</h2><p>Providers match only when their verified service area includes the pickup location and they are approved, online and available for the requested service.</p></div><span class="module-hero-badge">${icon('pin')}${escapeHTML(selectedLocation)} · Configurable scope</span></div>
      <section class="card"><div class="card-header"><div><h2 class="card-title">Operational coverage</h2><p class="card-subtitle">Sample configuration · Choose an LGA to see its service neighborhoods.</p></div><span class="badge badge-green">Location matching on</span></div><div class="location-panel" style="padding:0 17px 17px"><aside class="location-panel-aside"><label for="stateSelect">State</label><select id="stateSelect" class="select-control"><option>Kano State</option><option disabled>+ Configure another state</option></select><div style="height:14px"></div><label>Local government area</label><div class="location-list">${LGA_LIST.map((lga) => `<button class="${lga.name === selectedLga ? 'active' : ''}" type="button" data-action="select-lga" data-lga="${escapeAttr(lga.name)}">${escapeHTML(lga.name)}<small>${lga.areas.length} areas</small></button>`).join('')}</div></aside><div class="location-area-content"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px"><div><h3 style="font:800 12px Manrope,sans-serif;color:#324439">${escapeHTML(selected.name)} service areas</h3><p style="margin-top:4px;color:#89948d;font-size:9px">Eligible providers can cover these configured neighborhoods.</p></div><span class="badge badge-blue">${allAreas.length} areas</span></div>${allAreas.map((area) => `<span class="area-chip">${icon('pin')}${escapeHTML(area)}</span>`).join('')}${state.customAreas.length ? `<div class="field-help" style="margin-top:9px">Custom areas created in this browser are shown in the selected LGA.</div>` : ''}<div class="rule-note" style="margin-top:13px">${icon('info')}<span>Use a structured state/LGA/area dataset. GPS may support proximity checks, but request location permission transparently.</span></div></div></div></section>
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
          <label class="mode-option ${selectedModel === 'per_request' ? 'selected' : ''}"><input type="radio" name="model" value="per_request" ${selectedModel === 'per_request' ? 'checked' : ''}><span class="mode-radio"></span><strong>Set per request</strong><small>An authorized operator enters the payout at assignment.</small></label>
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
    return `<div class="mode-detail"><strong style="display:block;color:#55655a;font-size:9px">Amount set individually for each request</strong><p style="margin-top:5px;color:#8e9991;font-size:8px;line-height:1.5">No default payout is stored. At assignment, an authorized operator enters the amount for that order. Production must validate the order, operator permission, available balance and any approval threshold.</p><input type="hidden" name="amount" value="0"><input type="hidden" name="rate" value="0"></div>`;
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
  }

  function closeModal() {
    const root = document.getElementById('modalRoot');
    if (root) root.innerHTML = '';
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
      toast('Percentage = share of eligible base · Custom amount = fixed payout per completed order · Per request = operator enters a payout before assignment.');
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
      if (action === 'new-rule') { renderRuleModal(); return; }
      if (action === 'open-order') { renderOrderModal(actionButton.dataset.id); return; }
      if (action === 'add-test-order') { addTestOrder(); return; }
      if (action === 'transition-order') { transitionOrder(actionButton.dataset.id, actionButton.dataset.next); return; }
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
      if (action === 'add-area') { simpleTextModal('Add operational area', 'Add a service neighborhood to the current Kano State coverage. A production system should validate it against the selected LGA.', 'Area name', 'area', 'e.g. Central Market'); return; }
      if (action === 'select-lga') { state.selectedLga = actionButton.dataset.lga; saveState(); render(); return; }
      if (['module-help', 'module-view-all', 'record-info', 'module-action', 'rule-help', 'audit-info', 'role-help', 'feature-help', 'location-guidance', 'form-guidance'].includes(action)) { infoMessage(action, actionButton); return; }
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
    if (event.target.matches('[data-preview-key]')) refreshFormPreviewConditions();
  });

  document.addEventListener('input', (event) => {
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
    if (!input || !input.value.trim()) {
      input?.closest('.form-field')?.classList.add('has-error');
      input?.focus();
      return;
    }
    if (action === 'area') {
      const name = input.value.trim();
      if (!state.customAreas.some((area) => area.toLowerCase() === name.toLowerCase())) state.customAreas.push(name);
      addActivity('Service area added', `${name} · ${state.selectedLga || 'Kano Municipal'}`, 'Coverage');
      saveState();
      closeModal();
      render();
      toast(`${name} added to this browser’s service-area demo.`);
    }
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
