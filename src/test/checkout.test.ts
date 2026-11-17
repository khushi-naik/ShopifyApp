import { describe, expect, it } from "vitest";

import {
  beforeYouBuy,
  computeSession,
  shippingCost,
  type Address,
} from "@/lib/checkout";
import type {
  Brief,
  CartLine,
  Product,
  Variant,
  VibeRead,
} from "@/lib/room-types";

const address: Address = {
  name: "Sam Shopper",
  line1: "12 Oak Street",
  city: "Portland",
  postal: "97201",
  country: "US",
};

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
const variant: Variant = { id: "variant-1", label: "Walnut", price: 200 };
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

describe("checkout preparation", () => {
  it("calculates standard free shipping at the threshold and express shipping", () => {
    expect(shippingCost("standard", 149.99)).toBe(9.95);
    expect(shippingCost("standard", 150)).toBe(0);
    expect(shippingCost("express", 50)).toBe(24.95);
  });

  it("moves from incomplete to ready only when the cart, address and shipping are complete", () => {
    expect(computeSession([line], address, null).status).toBe("incomplete");
    expect(
      computeSession([line], { ...address, postal: "" }, "standard").status,
    ).toBe("incomplete");

    const complete = computeSession([line], address, "standard");
    expect(complete.status).toBe("ready_for_complete");
    expect(complete).toMatchObject({
      subtotal: 200,
      shipping: 0,
      tax: 16,
      total: 216,
      missing: [],
    });
  });

  it("keeps an empty cart incomplete even when the delivery details are complete", () => {
    expect(computeSession([], address, "standard").status).toBe("incomplete");
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
      address,
    ).find((item) => item.label === "Fits your space");

    expect(check).toMatchObject({
      ok: false,
      detail:
        "Too big: Wide sofa; Size not listed; check with seller: Unknown size",
    });
    expect(
      beforeYouBuy([line], vibe, { ...brief, spaceWidth: null }, address).some(
        (item) => item.label === "Fits your space",
      ),
    ).toBe(false);
  });

  it("marks the space check as passing when every known width fits", () => {
    const check = beforeYouBuy([line], vibe, brief, address).find(
      (item) => item.label === "Fits your space",
    );
    expect(check).toMatchObject({
      ok: true,
      detail: "All items fit within 72 inches",
    });
  });
});
