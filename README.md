# ErrandX Control Centre

A responsive, interactive Super Admin prototype for the ErrandX multi-vendor marketplace concept. The repository was a blank starter, so this implementation focuses on the operator experience and the key earning-policy requirement while clearly labeling operational records as demo data.

## Run the prototype

```sh
node server.js
```

Open `http://localhost:4173`. The server binds to `0.0.0.0` for preview environments. No package install or external image/font service is required.

## Earning policy workspace

Super Admin can add, edit, pause/activate, search, filter and export earning rules for:

- Individual riders
- Company fleet riders
- Restaurants
- Small-chops vendors

Each rule can use one of three payout methods:

1. **Percentage** — a percentage of the rule's eligible calculation base.
2. **Custom amount** — a fixed naira amount per completed order.
3. **Set per request** — no default is stored; an authorized operator enters an amount for a particular request.

The rule's calculation base is explicit (delivery/service fee, vendor item subtotal, company rider allocation or an operator-supplied base). A live calculator previews the payout and remaining amount. It warns when a sample payout exceeds the entered base. Rule changes and feature/permission matrix edits persist in that browser's `localStorage`. The CSV export is also generated in the browser.

The seeded rates and activity in this prototype are illustrative only. They are not recommended commercial rates and are not connected to orders, wallets or payment providers.

## Prototype coverage

The admin sidebar includes screens for operations, the marketplace, rider and vendor onboarding, finance, locations, order forms, website content, roles and feature controls. The public marketing preview is available at `/site.html` and is also linked from Website Builder. The Live orders view has a controlled, sequential errand/vendor workflow with a local event timeline, test-order creation and completion/settlement guardrails. The form builder supports field creation/editing, required validation, conditional questions, accessible reordering, draft/publish, preview and version-history snapshots. Roles, feature flags, a dynamic operating-location selector, Nigeria-wide state/LGA/neighborhood coverage configuration, provider matching and earning-rule tools are interactive. Pages disclose demo data; no order, sign-in, partner application or form action is sent to a server.

## Applications & KYC review demo

Open **Applications** from the People & access navigation to use the browser-local review queue. The seeded Kano examples cover individual riders, company fleets, restaurants and small-chops vendors. Search and filter the queue, assign a demo reviewer, start a review, update the type-specific checklist, request more information, simulate an applicant resubmission, or approve/reject with a required reviewer note. Approval is blocked until every checklist item is checked; every decision and status transition is added to a local history. Reviewer notes reject 11-digit identity-number patterns.

The evidence register contains **metadata labels and illustrative statuses only**. Its “View metadata” action logs a local access event; it never opens, collects or displays a file. The demo does not accept identity uploads, real NIN/BVN values, guarantor details or verification media. Do not enter real personal data. Application changes and history are saved in this browser's editable `localStorage`, so they are not a secure audit ledger and are not sent to a server.

## Location-aware coverage demo

The Service areas screen now supports a coverage scope across Nigeria's 36 states and the Federal Capital Territory. Kano starts with illustrative LGAs and neighborhoods; add another state, then enter LGAs and operational areas, switch the selected scope, or remove an area. The operating-view selector reflects configured states and LGAs. These records are stored in this browser, no GPS permission is requested, and no real routing or geofencing occurs. LGAs and neighborhoods are manually entered examples—not an authoritative boundary dataset—and must be validated before production use.

## Assignment queue demo

The Assignment queue matches pending errand requests to individual/company riders, vendor orders to the corresponding restaurant or small-chops partner type, and ready vendor orders to pickup riders. Candidate checks combine demo approval (including company approval for fleet riders), online/available status, capacity, service category and configured state/LGA/neighborhood scope. Send a simulated offer, then simulate acceptance or timeout; accepted first-stage offers advance through the existing order state machine, while timeouts return to the queue. Offer history is browser-local. No push/SMS is sent, and sample candidate records are not live availability or authorization.

## Not production-ready

This is a **front-end prototype**, not a live ErrandX marketplace. It has no authentication, PHP API, MySQL persistence, server-side authorization, real order state machine, KYC storage, notifications, payment integration, bank payouts or enforceable audit trail. `localStorage` is user-editable and must never be trusted for financial or access-control decisions.

Before handling real customers or money, connect the interface to a modular PHP backend with PDO/prepared statements, secure sessions and CSRF protection; enforce every permission and resource scope at the endpoint; model orders as a server-validated state machine; and record money in an auditable, balanced ledger. Encrypt provider secrets at rest, verify signed payment/payout webhooks, store identity files outside the public web root, and require authorized reviewers for sensitive changes. Provider eligibility and settlement timing must be confirmed with the live provider account.
