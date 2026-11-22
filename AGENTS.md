# ShopLledger Agent Guide

## Stack
- Node.js CommonJS app using Express 4 and body-parser; browser UI is plain HTML, CSS, and JavaScript under `public/`.
- Business data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoint.
- `routes/orders.js` — order listing, lookup, placement, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon lookup, validation, discount calculation, and active coupon listing.
- `lib/dates.js` — current date, normalized date keys, and fiscal year helper.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reserve/release, and inventory summary.
- `lib/invoice.js` — invoice figures and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata order debits/reversals, and settlements.
- `lib/orders.js` — add, get, cancel, and filter/list orders.
- `lib/pricing.js` — subtotal, discount delegation, and checkout totals with per-line GST.
- `lib/reports.js` — dashboard summary and invoice-versus-order GST reconciliation.
- `lib/store.js` — synchronous JSON database read/write and bounded audit log append.
- `lib/tax.js` — item GST rate/slab resolution and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (the repository currently has no test files or test suite configured).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
