# Room Match

Room Match is a TanStack Start app that reads a room photo, asks for a short
shopping brief, and recommends live products from Shopify's Global Catalog.

## Requirements

- Node.js 22.12 or newer (the project selects Node 22 in `.nvmrc`)
- npm (included with Node.js)

## Install and run

From the repository root, use nvm to select the project’s Node version:

```sh
nvm install
nvm use
node --version
npm install
npm run dev
```

Confirm `node --version` prints `v22.12.0` or newer before starting Vite.
Open the local URL printed by Vite in the terminal. Stop the development
server with `Ctrl+C`.

If nvm is not installed, install Node.js 22.12 or newer using your preferred
Node version manager or the official Node.js installer, then open a new
terminal and confirm `node --version` before running `npm install`.

To start the app with a temporary Node 22 runtime without changing your
default Node installation, run:

```sh
npm exec --yes --package=node@22 -- npm run dev
```

The repository also includes a Bun lockfile. If you use Bun, install and run
with `bun install --frozen-lockfile` and `bun run dev`.

## Optional: AI room analysis

Set `LOVABLE_API_KEY` in the server environment before starting the app to use
the Lovable AI gateway for room analysis. Keep the key out of browser code and
source control. If the key is missing or the AI request fails, the app uses a
color-based demo analysis instead; the analysis card identifies this as
“Demo analysis.”

## Checks

```sh
npm test
npm run lint
npm run build
```

## App flow

- Choose whether to fill an empty space or refresh a furnished room, then drop
  or browse for a photo. Sample photos are in `public/samples/`.
- The app resizes the photo in the browser and reads its colors. With a
  server-side `LOVABLE_API_KEY` and a successful gateway request, the room read
  uses AI; otherwise, the color-based demo read is used.
- Set a goal, per-piece budget, availability/rating/sale requirements, and
  indoor or outdoor use. Recommendations are filtered against those
  requirements, then ranked by room need, style, palette, rating, review count,
  value, quality details and discounts.
- Optionally enter the available width in inches. Product cards and the
  “Before you buy” checklist compare it with a listed product width; if a width
  is unavailable, Room Match asks the shopper to check with the seller.
- Product and seller data comes from Shopify's live UCP Global Catalog using
  the server-side JSON-RPC `search_catalog` tool. The app calls Shopify's
  catalog endpoint directly so it also works in the Cloudflare Worker runtime;
  it does not spawn the local UCP CLI as a subprocess. The globally installed
  UCP CLI is useful for local catalog exploration but is not required to run
  the app (the CLI itself requires Node.js 22.19 or newer).
- Catalog search currently requests products that ship to the US and prices
  in USD. Live availability, prices, ratings, reviews and discounts vary;
  Shopify may not provide every detail for every listing, and unknown ratings
  or use cases are not invented.
- The cart groups items by merchant and provides a secure checkout handoff when
  the catalog supplies an HTTPS checkout or product URL. Shoppers review each
  store's subtotal and refund policy, plus a “Before you buy” checklist.
  Shipping and tax are set by each store. Room Match does not submit orders,
  collect payment or contact merchants.
