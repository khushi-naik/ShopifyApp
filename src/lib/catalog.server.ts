import {
  PALETTE_TAGS,
  type Category,
  type Product,
  type ProductGroup,
  type Style,
  type Variant,
} from "./room-types";

const UCP_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const UCP_AGENT_PROFILE =
  "https://shopify.dev/ucp/agent-profiles/2026-08-25/valid-with-capabilities.json";
const UCP_RESULT_LIMIT = 30;

type SearchCatalogRequest = {
  catalog: {
    query: string;
    filters: {
      ships_to: { country: string };
      available?: boolean;
      price: { max: number };
      rating?: { variant: { min: number; min_count: number } };
    };
    context: {
      address_country: string;
      currency: string;
      intent: string;
    };
    pagination: { limit: number };
  };
};

type UcpPrice = { amount?: unknown; currency?: unknown };
type UcpRating = { value?: unknown; count?: unknown };
type UcpSeller = {
  name?: unknown;
  domain?: unknown;
  links?: unknown;
};
type UcpVariant = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  options?: unknown;
  price?: UcpPrice;
  list_price?: UcpPrice;
  availability?: { available?: unknown };
  seller?: UcpSeller;
  url?: unknown;
  checkout_url?: unknown;
  media?: unknown;
  rating?: UcpRating;
};
type UcpProduct = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  url?: unknown;
  categories?: unknown;
  rating?: UcpRating;
  media?: unknown;
  metadata?: unknown;
  variants?: unknown;
};
type UcpCatalogResult = {
  products?: unknown;
  messages?: unknown;
};
type UcpMcpResponse = {
  error?: { message?: unknown };
  result?: {
    isError?: unknown;
    content?: unknown;
    structuredContent?: UcpCatalogResult;
  };
};

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function collectText(value: unknown): string[] {
  if (typeof value === "string") {
    const text = stripMarkup(value);
    return text ? [text] : [];
  }
  if (Array.isArray(value)) return value.flatMap(collectText);
  const record = asRecord(value);
  return record ? Object.values(record).flatMap(collectText) : [];
}

function getDescription(value: unknown): string {
  const record = asRecord(value);
  return collectText(record?.["plain"] ?? record?.["html"])[0] ?? "";
}

function getMetadataText(value: unknown): string[] {
  const metadata = asRecord(value);
  if (!metadata) return [];
  return [
    ...collectText(metadata["attributes"]),
    ...collectText(metadata["tech_specs"]),
    ...collectText(metadata["top_features"]),
    ...collectText(metadata["unique_selling_points"]),
  ];
}

function getQualityNote(value: unknown, description: string): string {
  const metadata = asRecord(value);
  for (const key of [
    "unique_selling_points",
    "top_features",
    "tech_specs",
    "attributes",
  ]) {
    const detail = collectText(metadata?.[key])[0];
    if (detail) return detail.slice(0, 180);
  }
  return description.slice(0, 180);
}

function getImage(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const media = value
    .map(asRecord)
    .filter((item): item is RecordValue => item !== null);
  const image = media.find((item) => item["type"] === "image") ?? media[0];
  return secureUrl(image?.["url"]);
}

function secureUrl(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function priceInUsd(value: unknown): number | null {
  const price = asRecord(value);
  const amount = price?.["amount"];
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    price?.["currency"] !== "USD"
  ) {
    return null;
  }
  return amount / 100;
}

function ratingInfo(value: unknown): {
  value: number | null;
  count: number | null;
} {
  const rating = asRecord(value);
  const ratingValue = rating?.["value"];
  const count = rating?.["count"];
  return {
    value:
      typeof ratingValue === "number" && Number.isFinite(ratingValue)
        ? ratingValue
        : null,
    count: typeof count === "number" && Number.isFinite(count) ? count : null,
  };
}

function optionLabel(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const labels = value
    .map(asRecord)
    .filter((option): option is RecordValue => option !== null)
    .map((option) => asString(option["label"]))
    .filter((label): label is string => label !== null);
  return labels.length ? labels.join(" / ") : null;
}

function refundPolicy(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const link of value) {
    const record = asRecord(link);
    if (record?.["type"] === "refund_policy") {
      return secureUrl(record["url"]);
    }
  }
  return null;
}

const CATEGORY_MATCHERS: Array<[Category, RegExp]> = [
  ["seating", /\b(?:sofa|couch|chair|armchair|bench|ottoman|stool|seating)\b/i],
  ["rugs", /\b(?:rugs?|carpets?|runners?|doormats?)\b/i],
  ["lighting", /\b(?:lighting|lamps?|sconces?|pendants?|chandeliers?)\b/i],
  ["wall art", /\b(?:wall art|prints?|posters?|canvases?|wall decor)\b/i],
  ["mirrors", /\bmirrors?\b/i],
  ["tables", /\b(?:tables?|desks?)\b/i],
  ["storage", /\b(?:storage|cabinets?|shelves|bookcases?|baskets?)\b/i],
  [
    "textiles",
    /\b(?:textiles?|pillows?|cushions?|blankets?|throws?|curtains?)\b/i,
  ],
  ["plants", /\b(?:plants?|planters?|trees?)\b/i],
  ["decor", /\b(?:vases?|candles?|sculptures?|figurines?|decorative)\b/i],
];

function inferCategory(text: string): Category {
  return (
    CATEGORY_MATCHERS.find(([, pattern]) => pattern.test(text))?.[0] ?? "decor"
  );
}

const STYLE_MATCHERS: Array<[Style, RegExp]> = [
  ["Mid-Century Modern", /\bmid[- ]century\b/i],
  ["Boho", /\b(?:boho|bohemian)\b/i],
  ["Minimalist", /\bminimal(?:ist|ism)?\b/i],
  ["Scandinavian", /\b(?:scandinavian|scandi|nordic)\b/i],
  ["Traditional", /\b(?:traditional|classic)\b/i],
  ["Industrial", /\bindustrial\b/i],
];

function inferStyles(text: string): Style[] {
  return STYLE_MATCHERS.filter(([, pattern]) => pattern.test(text)).map(
    ([style]) => style,
  );
}

const PALETTE_ALIASES: Record<string, string[]> = {
  cream: ["cream", "ivory"],
  white: ["white"],
  beige: ["beige", "tan", "taupe"],
  oat: ["oat"],
  walnut: ["walnut"],
  terracotta: ["terracotta"],
  rust: ["rust"],
  sage: ["sage"],
  green: ["green", "olive"],
  navy: ["navy"],
  charcoal: ["charcoal"],
  black: ["black"],
  brass: ["brass", "gold", "bronze"],
  gray: ["gray", "grey"],
};

function inferPalette(text: string): string[] {
  return Object.keys(PALETTE_TAGS).filter((tag) =>
    (PALETTE_ALIASES[tag] ?? [tag]).some((alias) =>
      new RegExp(`\\b${alias}\\b`, "i").test(text),
    ),
  );
}

const ROOM_TYPES = [
  "living room",
  "bedroom",
  "dining room",
  "bathroom",
  "patio",
  "balcony",
  "hallway",
  "nursery",
  "home office",
];

function inferRoomTypes(text: string): string[] {
  return ROOM_TYPES.filter((room) => text.toLowerCase().includes(room));
}

function inferUseCase(text: string): Product["indoor_outdoor"] {
  const outdoor =
    /\b(?:outdoor|patio|garden|deck|weatherproof|weather[- ]resistant|uv[- ]resistant|mildew[- ]resistant)\b/i.test(
      text,
    );
  const indoor =
    /\b(?:indoor|living room|bedroom|dining room|bathroom|interior)\b/i.test(
      text,
    );
  if (indoor && outdoor) return "both";
  if (outdoor) return "outdoor";
  if (indoor) return "indoor";
  return "unknown";
}

function productRating(values: unknown[], fallback: unknown) {
  const productRating = ratingInfo(fallback);
  const variantRatings = values
    .map(ratingInfo)
    .filter(
      (rating): rating is { value: number; count: number | null } =>
        rating.value !== null,
    )
    .sort((a, b) => b.value - a.value);
  const bestVariantRating = variantRatings[0];
  return {
    value: productRating.value ?? bestVariantRating?.value ?? null,
    count: productRating.count ?? bestVariantRating?.count ?? null,
  };
}

function normalizeVariant(
  product: UcpProduct,
  value: UcpVariant,
): Variant | null {
  const id = asString(value.id);
  const price = priceInUsd(value.price);
  const productUrl = secureUrl(value.url) ?? secureUrl(product.url);
  const checkoutUrl = secureUrl(value.checkout_url);
  if (!id || price === null || (!productUrl && !checkoutUrl)) return null;

  const listPrice = priceInUsd(value.list_price);
  const compareAt = listPrice !== null && listPrice > price ? listPrice : null;
  const options = optionLabel(value.options);
  const label =
    options ?? asString(value.title) ?? asString(product.title) ?? "Standard";
  return {
    id,
    label,
    price,
    compare_at_price: compareAt,
    discount_percent: compareAt
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : 0,
    available: asRecord(value.availability)?.["available"] === true,
    product_url: productUrl,
    checkout_url: checkoutUrl,
  };
}

export function normalizeUcpProducts(
  values: unknown[],
  country: string,
): ProductGroup[] {
  const groups: ProductGroup[] = [];

  for (const value of values) {
    const product = asRecord(value) as UcpProduct | null;
    if (!product) continue;

    const productId = asString(product.id);
    const title = asString(product.title);
    const description = getDescription(product.description);
    const metadataText = getMetadataText(product.metadata);
    const categoriesText = collectText(product.categories);
    const baseText = [
      title,
      description,
      ...metadataText,
      ...categoriesText,
    ].join(" ");
    if (!productId || !title || !Array.isArray(product.variants)) {
      continue;
    }
    const rawVariants = product.variants;
    const imageUrl =
      getImage(product.media) ??
      rawVariants
        .map((variant) => getImage(asRecord(variant)?.["media"]))
        .find((image): image is string => image !== null);
    if (!imageUrl) continue;

    const sellerVariants = new Map<
      string,
      {
        seller: UcpSeller;
        variants: Array<{ source: UcpVariant; variant: Variant }>;
      }
    >();
    for (const rawVariant of rawVariants) {
      const source = asRecord(rawVariant) as UcpVariant | null;
      if (!source) continue;
      const seller = asRecord(source.seller) as UcpSeller | null;
      if (!seller) continue;
      const sellerName = asString(seller.name) ?? asString(seller.domain);
      if (!sellerName) continue;
      const variant = normalizeVariant(product, source);
      if (!variant) continue;

      const key = asString(seller.domain) ?? sellerName;
      const entry = sellerVariants.get(key) ?? { seller, variants: [] };
      entry.variants.push({ source, variant });
      sellerVariants.set(key, entry);
    }

    const offers: Product[] = [];
    for (const [sellerKey, sellerData] of sellerVariants) {
      const sorted = sellerData.variants.sort(
        (a, b) => a.variant.price - b.variant.price,
      );
      const first = sorted[0];
      if (!first) continue;
      const variants = sorted.map(({ variant }) => variant);
      const primary = variants[0];
      if (!primary) continue;
      const variantText = sorted
        .map(({ source }) => [
          asString(source.title),
          getDescription(source.description),
          optionLabel(source.options),
        ])
        .flat()
        .filter((item): item is string => item !== null)
        .join(" ");
      const searchableText = `${baseText} ${variantText}`;
      const rating = productRating(
        sorted.map(({ source }) => source.rating),
        product.rating,
      );
      const sellerRecord = asRecord(sellerData.seller);
      const policy = refundPolicy(sellerRecord?.["links"]);
      const productUrl = primary.product_url;
      const checkoutUrl = primary.checkout_url;

      offers.push({
        id: `${productId}:${sellerKey}`,
        product_key: productId,
        title,
        merchant:
          asString(sellerRecord?.["name"]) ??
          asString(sellerRecord?.["domain"]) ??
          "Shopify merchant",
        category: inferCategory(searchableText),
        style_tags: inferStyles(searchableText),
        palette_tags: inferPalette(searchableText),
        room_types: inferRoomTypes(searchableText),
        indoor_outdoor: inferUseCase(searchableText),
        price: primary.price,
        compare_at_price: primary.compare_at_price ?? null,
        discount_percent: primary.discount_percent ?? 0,
        rating: rating.value,
        review_count: rating.count,
        quality_note: getQualityNote(product.metadata, description),
        in_stock: variants.some((variant) => variant.available === true),
        ships_to: [country],
        image_url: imageUrl,
        continue_url: checkoutUrl ?? productUrl ?? null,
        product_url: productUrl ?? null,
        return_policy: policy,
        requires_review: false,
        variants,
      });
    }

    if (offers.length) groups.push({ product_key: productId, offers });
  }

  return groups;
}

function getUcpError(payload: UcpMcpResponse): string | null {
  const errorMessage = asString(payload.error?.message);
  if (errorMessage) return errorMessage;
  if (payload.result?.isError !== true) return null;
  return (
    collectText(payload.result.content)[0] ??
    "The UCP service returned an error."
  );
}

export async function searchCatalog(
  request: SearchCatalogRequest,
): Promise<ProductGroup[]> {
  const response = await fetch(UCP_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(25_000),
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      id: 1,
      params: {
        name: "search_catalog",
        arguments: {
          meta: { "ucp-agent": { profile: UCP_AGENT_PROFILE } },
          catalog: {
            ...request.catalog,
            pagination: { limit: UCP_RESULT_LIMIT },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify UCP catalog request failed (HTTP ${response.status}).`,
    );
  }

  const payload = (await response.json()) as UcpMcpResponse;
  const error = getUcpError(payload);
  if (error) throw new Error(`Shopify UCP catalog search failed: ${error}`);

  const products = payload.result?.structuredContent?.products;
  if (!Array.isArray(products)) {
    throw new Error("Shopify UCP returned an unexpected catalog response.");
  }

  return normalizeUcpProducts(
    products,
    request.catalog.filters.ships_to.country,
  );
}
