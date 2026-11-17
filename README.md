# Room Match

Room Match is a TanStack Start app that reads a room photo, asks for a short
shopping brief, and recommends decor from a demo catalog.

## Requirements

- Node.js 22.12 or newer
- npm (included with Node.js)

## Install and run

From the repository root:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

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
- Product and seller data is mock data (40 offers across 24 product groups),
  not a live Shopify catalog. Prices, stock, ratings, reviews and discounts are
  illustrative.
- The cart and checkout screens let shoppers review shipping, estimated tax
  and a pre-purchase checklist. They do not submit an order, collect payment or
  contact a merchant.
