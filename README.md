# Yviora storefront

A responsive, dependency-free storefront for Yviora, built with HTML, CSS, and vanilla JavaScript. The catalog is intentionally empty for now. The shop, cart, checkout, and wishlist pages show empty states until products are added.

## Run locally

With Node.js installed, start the included preview server from this folder:

```powershell
node server.cjs
```

Then open <http://127.0.0.1:8000>. Set the `PORT` environment variable to use another port. The optional product photography and web fonts load remotely; the current empty-catalog home page uses CSS artwork.

Run the local smoke checks with `node smoke-test.cjs`.

## Theme

Use the moon/sun control in the header to switch between light and dark mode. The choice is saved in this browser.

## Catalog and demo behavior

- The built-in catalog is empty. Adding actual products later can be done through the demo owner page or by adding confirmed records to `DEFAULT_PRODUCTS` in `app.js`.
- On the first load after this update, the app clears the previous demo products, cart, wishlist, and coupon from local storage so old sample items do not reappear.
- Owner edits are stored only in this browser. The owner page is a local demo without authentication, database, server-side authorization, or image upload; do not use it for real customer or business data.
- Checkout, contact, and newsletter forms are demo-only. No order is sent, no payment is processed, and no email or message is transmitted.
- Payment options are placeholders. No payment provider, customer account, or order backend is connected.
- Policy pages remain editable templates. Confirm actual business terms before publishing.

## Production integration plan

Connect a database-backed product, inventory, customer, and order service; validate stock and prices on the server; secure owner functions with authentication and server-side authorization; use trusted image storage; and connect transactional email and a newsletter provider when configured. Choose a payment provider that supports the desired Philippine methods and verify its current documentation, settlement, fees, and webhook requirements. Create payment sessions server-side and verify signed webhooks. Never collect payment credentials directly in the storefront.

No environment variables are needed for this local demo. A backend deployment will need values appropriate to the selected services, for example:

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `DATABASE_URL` | Server connection to the selected database | Server only |
| `AUTH_SECRET` | Session or authentication signing secret | Server only |
| `PAYMENT_API_KEY` | Create payment sessions with the chosen provider | Server only |
| `PAYMENT_WEBHOOK_SECRET` | Verify signed payment webhooks | Server only |
| `EMAIL_API_KEY` | Send order and support emails | Server only |
| `STORAGE_BUCKET` | Product-image storage target | Server configuration |
| `PUBLIC_STORE_URL` | Canonical storefront URL used in callbacks and email | Public configuration |

These are examples, not wired integrations. Put secrets in the deployment platform's secret manager, never in `app.js`, HTML, or a public client bundle.

## Files

- `index.html` — app shell, navigation, theme control, and metadata.
- `styles.css` — responsive light and dark visual systems.
- `app.js` — empty catalog, page rendering, and front-end demo interactions.
- `server.cjs` — dependency-free local preview server.
- `smoke-test.cjs` — checks empty states, legacy sample cleanup, and theme persistence.
