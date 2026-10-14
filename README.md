# Yviora storefront

A responsive storefront prototype for Yviora, with twelve product listings: nine keychains and three caps using the photos supplied for this shop.

## Run locally

Use Node.js 18 or newer:

    node server.cjs

Then open http://localhost:4173.

## Current catalog

The shop shows nine keychains and charms plus three caps. Product photos are stored locally as keychain_1.jpg through keychain_9.jpg and cap_1.jpg through cap_3.jpg. Price and inventory are pending, so the product pages show “Coming soon” and add-to-cart is disabled until those details are set in the demo owner dashboard.

The storefront has responsive layouts, search and category filters, a wishlist, cart and checkout demo, policies, a contact form preview, and a persistent light/dark theme toggle.

## Before launch

The dashboard and checkout are browser-only prototypes. They do not provide secure owner access, database storage, live order submission, payment processing, shipping quotes, transactional email, or real customer account management. Configure and verify the real product prices, available stock, shipping details, and policies before accepting orders.
