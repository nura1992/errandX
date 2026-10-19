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

The sidebar includes mock screens for operations, the marketplace, rider and vendor onboarding, finance, locations, order forms, website content, roles and feature controls. The roles, feature flags, location selector, sample service-area addition and earning-rule tools are interactive. Pages intentionally disclose when they use demo records.

## Not production-ready

This is a **front-end prototype**, not a live ErrandX marketplace. It has no authentication, PHP API, MySQL persistence, server-side authorization, real order state machine, KYC storage, notifications, payment integration, bank payouts or enforceable audit trail. `localStorage` is user-editable and must never be trusted for financial or access-control decisions.

Before handling real customers or money, connect the interface to a modular PHP backend with PDO/prepared statements, secure sessions and CSRF protection; enforce every permission and resource scope at the endpoint; model orders as a server-validated state machine; and record money in an auditable, balanced ledger. Encrypt provider secrets at rest, verify signed payment/payout webhooks, store identity files outside the public web root, and require authorized reviewers for sensitive changes. Provider eligibility and settlement timing must be confirmed with the live provider account.
