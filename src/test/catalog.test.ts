import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizeUcpProducts, searchCatalog } from "@/lib/catalog.server";

const catalogRequest = {
  catalog: {
    query: "Scandinavian living room rugs",
    filters: {
      ships_to: { country: "US" },
      available: true,
      price: { max: 50000 },
      rating: { variant: { min: 4, min_count: 1 } },
    },
    context: {
      address_country: "US",
      currency: "USD",
      intent: "Find a Scandinavian living room rug",
    },
    pagination: { limit: 6 },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function normalizedWidth({
  title = "Decor item",
  description,
  techSpecs,
  variantLabel,
}: {
  title?: string;
  description?: string;
  techSpecs?: string;
  variantLabel?: string;
}): number | null {
  const products = normalizeUcpProducts(
    [
      {
        id: "gid://shopify/Product/width-test",
        title,
        description: description ? { plain: description } : undefined,
        metadata: techSpecs ? { tech_specs: techSpecs } : undefined,
        media: [{ type: "image", url: "https://cdn.example/item.jpg" }],
        variants: [
          {
            id: "gid://shopify/ProductVariant/width-test",
            title: variantLabel ?? "Standard",
            options: variantLabel
              ? [{ name: "Size", label: variantLabel }]
              : [],
            price: { amount: 10000, currency: "USD" },
            availability: { available: true },
            seller: { name: "Test Seller" },
            url: "https://seller.example/products/item",
          },
        ],
      },
    ],
    "US",
  );
  return products[0]?.offers[0]?.width ?? null;
}

describe("Shopify UCP catalog normalization", () => {
  it("creates seller-scoped offers with live prices, variants, links and available metadata", () => {
    const offers = normalizeUcpProducts(
      [
        {
          id: "gid://shopify/Product/123",
          title: "Scandinavian wool living room rug",
          description: {
            plain: "Handwoven beige wool rug for indoor living rooms.",
          },
          url: null,
          categories: ["Rugs"],
          rating: null,
          media: [
            {
              type: "image",
              url: "https://cdn.example/wool-rug.jpg",
            },
          ],
          metadata: { top_features: ["Handwoven natural wool"] },
          variants: [
            {
              id: "gid://shopify/ProductVariant/1",
              title: "5 x 7",
              options: [{ name: "Size", label: "5 x 7" }],
              price: { amount: 12000, currency: "USD" },
              list_price: { amount: 15000, currency: "USD" },
              availability: { available: true },
              seller: {
                name: "Rug Seller",
                domain: "rugs.example",
                links: [
                  {
                    type: "refund_policy",
                    url: "https://rugs.example/returns",
                  },
                ],
              },
              url: "https://rugs.example/products/wool-rug",
              checkout_url: "https://rugs.example/checkout",
              rating: { value: 4.7, scale_min: 1, scale_max: 5, count: 28 },
            },
            {
              id: "gid://shopify/ProductVariant/2",
              title: "5 x 7",
              price: { amount: 12500, currency: "USD" },
              availability: { available: true },
              seller: {
                name: "Another Rug Seller",
                domain: "another-rugs.example",
              },
              url: "https://another-rugs.example/products/wool-rug",
            },
          ],
        },
      ],
      "US",
    );

    expect(offers).toHaveLength(1);
    expect(offers[0]?.offers).toHaveLength(2);
    expect(offers[0]?.offers[0]).toMatchObject({
      product_key: "gid://shopify/Product/123",
      title: "Scandinavian wool living room rug",
      merchant: "Rug Seller",
      category: "rugs",
      style_tags: ["Scandinavian"],
      palette_tags: ["beige"],
      room_types: ["living room"],
      indoor_outdoor: "indoor",
      width: null,
      price: 120,
      compare_at_price: 150,
      discount_percent: 20,
      rating: 4.7,
      review_count: 28,
      quality_note: "Handwoven natural wool",
      in_stock: true,
      ships_to: ["US"],
      image_url: "https://cdn.example/wool-rug.jpg",
      continue_url: "https://rugs.example/checkout",
      product_url: "https://rugs.example/products/wool-rug",
      return_policy: "https://rugs.example/returns",
    });
    expect(offers[0]?.offers[0]?.variants[0]).toMatchObject({
      id: "gid://shopify/ProductVariant/1",
      label: "5 x 7",
      price: 120,
      compare_at_price: 150,
      discount_percent: 20,
      available: true,
    });
  });

  it("does not invent missing ratings or product use cases", () => {
    const offers = normalizeUcpProducts(
      [
        {
          id: "gid://shopify/Product/456",
          title: "Abstract sculpture",
          variants: [
            {
              id: "gid://shopify/ProductVariant/3",
              price: { amount: 8500, currency: "USD" },
              availability: { available: true },
              media: [
                { type: "image", url: "https://cdn.example/sculpture.jpg" },
              ],
              seller: { name: "Studio Shop" },
              url: "https://studio.example/products/sculpture",
            },
          ],
        },
      ],
      "US",
    );

    expect(offers[0]?.offers[0]).toMatchObject({
      rating: null,
      review_count: null,
      indoor_outdoor: "unknown",
    });
  });

  it("extracts explicit width measurements and converts centimeters without guessing", () => {
    expect(normalizedWidth({ title: 'Sofa 72"' })).toBe(72);
    expect(normalizedWidth({ description: "Width: 72 in" })).toBe(72);
    expect(normalizedWidth({ description: "W 72" })).toBe(72);
    expect(normalizedWidth({ title: "Console table 72 inch" })).toBe(72);
    expect(normalizedWidth({ techSpecs: "Width: 72 cm" })).toBe(28.3);
    expect(normalizedWidth({ variantLabel: "72 x 36 x 30" })).toBe(72);
    expect(normalizedWidth({ variantLabel: "72 x 36 x 30 cm" })).toBe(28.3);
    expect(normalizedWidth({ description: "Height: 72 inches" })).toBeNull();
    expect(normalizedWidth({ title: "Solid wood side table" })).toBeNull();
  });

  it("calls Shopify's UCP endpoint with catalog filters and surfaces failures", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ result: { structuredContent: { products: [] } } }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchCatalog(catalogRequest)).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://catalog.shopify.com/api/ucp/mcp",
      expect.objectContaining({ method: "POST" }),
    );
    const init = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(init?.body)) as {
      method: string;
      params: {
        name: string;
        arguments: {
          meta: { "ucp-agent": { profile: string } };
          catalog: typeof catalogRequest.catalog;
        };
      };
    };
    expect(body).toMatchObject({
      method: "tools/call",
      params: {
        name: "search_catalog",
        arguments: {
          meta: {
            "ucp-agent": {
              profile:
                "https://shopify.dev/ucp/agent-profiles/2026-08-25/valid-with-capabilities.json",
            },
          },
          catalog: {
            ...catalogRequest.catalog,
            pagination: { limit: 30 },
          },
        },
      },
    });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(searchCatalog(catalogRequest)).rejects.toThrow(
      "Shopify UCP catalog request failed (HTTP 503).",
    );
  });
});
