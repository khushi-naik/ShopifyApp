import { describe, expect, it } from "vitest";

import { passesHardFilters, rankGroups } from "@/lib/ranking";
import type { Brief, Product, ProductGroup, VibeRead } from "@/lib/room-types";

const brief: Brief = {
  goal: "specific",
  category: "seating",
  budget: 500,
  spaceWidth: null,
  inStock: true,
  rated4: true,
  onSale: false,
  setting: "indoor",
};

const vibe: VibeRead = {
  room_type: "living room",
  indoor_outdoor: "indoor",
  space_state: "furnished",
  primary_style: "Scandinavian",
  secondary_style: "Minimalist",
  palette_name: "Cream & Sage",
  palette: [{ name: "Cream", hex: "#efe6d6" }],
  gaps: [],
  keep: [{ item: "Sofa", color_hex: "#efe6d6" }],
  swaps: [],
  demo: true,
};

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    product_key: "chair",
    title: "Lounge chair",
    merchant: "Hearth & Grain",
    category: "seating",
    style_tags: ["Scandinavian"],
    palette_tags: ["cream"],
    room_types: ["living room"],
    indoor_outdoor: "indoor",
    width: null,
    price: 250,
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
    ...overrides,
  };
}

describe("room match ranking", () => {
  it("filters products that are for the wrong indoor/outdoor setting", () => {
    expect(
      passesHardFilters(product({ indoor_outdoor: "outdoor" }), brief),
    ).toBe(false);
    expect(
      passesHardFilters(product({ indoor_outdoor: "indoor" }), {
        ...brief,
        setting: "outdoor",
      }),
    ).toBe(false);
    expect(passesHardFilters(product({ indoor_outdoor: "both" }), brief)).toBe(
      true,
    );
    expect(
      passesHardFilters(product({ indoor_outdoor: "unknown" }), {
        ...brief,
        setting: "outdoor",
      }),
    ).toBe(false);
  });

  it("selects the better-priced eligible seller offer and keeps seller count", () => {
    const offers: ProductGroup[] = [
      {
        product_key: "chair",
        offers: [
          product({ id: "expensive", price: 350 }),
          product({
            id: "better-value",
            merchant: "Oak Lane Home",
            price: 250,
          }),
        ],
      },
    ];

    expect(rankGroups(offers, brief, vibe)).toMatchObject([
      { product: { id: "better-value" }, otherOffers: 1 },
    ]);
  });

  it("excludes products below the selected rating or above the piece budget", () => {
    const groups: ProductGroup[] = [
      {
        product_key: "low-rated",
        offers: [product({ id: "low-rated", rating: 3.8 })],
      },
      {
        product_key: "over-budget",
        offers: [product({ id: "over-budget", price: 600 })],
      },
      {
        product_key: "no-rating",
        offers: [product({ id: "no-rating", rating: null })],
      },
    ];

    expect(rankGroups(groups, brief, vibe)).toEqual([]);
  });
});
