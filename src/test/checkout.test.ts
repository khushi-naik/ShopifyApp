import { describe, expect, it } from "vitest";

import { beforeYouBuy, checkoutHandoffUrl } from "@/lib/checkout";
import type {
  Brief,
  CartLine,
  Product,
  Variant,
  VibeRead,
} from "@/lib/room-types";

const product: Product = {
  id: "product-1",
  product_key: "chair",
  title: "Lounge chair",
  merchant: "Hearth & Grain",
  category: "seating",
  style_tags: ["Mid-Century Modern"],
  palette_tags: ["walnut"],
  room_types: ["living room"],
  indoor_outdoor: "indoor",
  width: 60,
  price: 200,
  compare_at_price: null,
  discount_percent: 0,
  rating: 4.5,
  review_count: 100,
  quality_note: "Solid wood frame",
  in_stock: true,
  ships_to: ["US"],
  image_url: "/chair.jpg",
  continue_url: "https://merchant.example.com/checkout",
  return_policy: "30-day returns",
  requires_review: false,
  variants: [],
};
const variant: Variant = {
  id: "variant-1",
  label: "Walnut",
  price: 200,
  checkout_url: "https://merchant.example.com/variant-checkout",
};
const line: CartLine = { product, variant, qty: 1 };
const brief: Brief = {
  goal: "specific",
  category: "seating",
  budget: 500,
  spaceWidth: 72,
  inStock: true,
  rated4: true,
  onSale: false,
  setting: "indoor",
};
const vibe: VibeRead = {
  room_type: "living room",
  indoor_outdoor: "indoor",
  space_state: "furnished",
  primary_style: "Mid-Century Modern",
  secondary_style: "Scandinavian",
  palette_name: "Cream",
  palette: [],
  gaps: [],
  keep: [],
  swaps: [],
  demo: true,
};

describe("merchant checkout handoff", () => {
  it("prefers the first line variant checkout URL", () => {
    expect(checkoutHandoffUrl(line)).toBe(
      "https://merchant.example.com/variant-checkout",
    );
  });

  it("falls back to product checkout URLs and rejects non-HTTPS URLs", () => {
    const invalidVariantLine: CartLine = {
      ...line,
      variant: { ...variant, checkout_url: "http://insecure.example/checkout" },
    };
    expect(checkoutHandoffUrl(invalidVariantLine)).toBe(
      "https://merchant.example.com/checkout",
    );

    const productUrlLine: CartLine = {
      ...invalidVariantLine,
      product: {
        ...product,
        continue_url: null,
        product_url: "https://merchant.example.com/product",
      },
    };
    expect(checkoutHandoffUrl(productUrlLine)).toBe(
      "https://merchant.example.com/product",
    );
    expect(
      checkoutHandoffUrl({
        ...productUrlLine,
        product: {
          ...productUrlLine.product,
          product_url: "javascript:alert(1)",
        },
      }),
    ).toBeNull();
  });

  it("warns about oversized and unknown widths, and skips the check without a space width", () => {
    const tooWide: CartLine = {
      ...line,
      product: { ...product, id: "wide", title: "Wide sofa", width: 80 },
    };
    const unknownWidth: CartLine = {
      ...line,
      product: {
        ...product,
        id: "unknown",
        title: "Unknown size",
        width: null,
      },
    };
    const check = beforeYouBuy(
      [line, tooWide, unknownWidth],
      vibe,
      brief,
      "US",
    ).find((item) => item.label === "Fits your space");

    expect(check).toMatchObject({
      ok: false,
      detail:
        "Too big: Wide sofa; Size not listed; check with seller: Unknown size",
    });
    expect(
      beforeYouBuy([line], vibe, { ...brief, spaceWidth: null }, "US").some(
        (item) => item.label === "Fits your space",
      ),
    ).toBe(false);
  });

  it("marks the space check as passing when every known width fits", () => {
    const check = beforeYouBuy([line], vibe, brief, "US").find(
      (item) => item.label === "Fits your space",
    );
    expect(check).toMatchObject({
      ok: true,
      detail: "All items fit within 72 inches",
    });
  });
});
