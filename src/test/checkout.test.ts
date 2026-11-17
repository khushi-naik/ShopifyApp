import { describe, expect, it } from "vitest";

import { computeSession, shippingCost, type Address } from "@/lib/checkout";
import type { CartLine, Product, Variant } from "@/lib/room-types";

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
});
