/**
 * Mock catalog shaped after Shopify's Global Catalog MCP (search_catalog / get_product).
 * Server-only: seed data lives here, never in the browser bundle.
 */
import type { Category, Product, ProductGroup, Style, Variant } from "./room-types";

type Base = {
  key: string;
  title: string;
  category: Category;
  styles: Style[];
  palette: string[];
  rooms: string[];
  io: "indoor" | "outdoor" | "both";
  price: number;
  photo: string;
  quality: string;
  variants: string[];
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

const BASES: Base[] = [
  { key: "walnut-lounge-chair", title: "Walnut Lounge Chair", category: "seating", styles: ["Mid-Century Modern", "Scandinavian"], palette: ["walnut", "rust"], rooms: ["living room", "bedroom"], io: "indoor", price: 389, photo: "1567538096630-e0c55bd6374c", quality: "Solid walnut frame, kiln-dried", variants: ["Rust wool", "Oat linen", "Charcoal"] },
  { key: "linen-sofa", title: "Low Linen Sofa, 3-Seat", category: "seating", styles: ["Scandinavian", "Minimalist"], palette: ["oat", "cream"], rooms: ["living room"], io: "indoor", price: 1290, photo: "1555041469-a586c61ea9bc", quality: "Removable washable covers", variants: ["Oat", "Sage", "Stone"] },
  { key: "rattan-accent-chair", title: "Rattan Peacock Accent Chair", category: "seating", styles: ["Boho"], palette: ["beige", "oat"], rooms: ["living room", "bedroom"], io: "indoor", price: 249, photo: "1586023492125-27b2c045efd7", quality: "Hand-woven rattan", variants: ["Natural"] },
  { key: "jute-rug", title: "Chunky Jute Rug", category: "rugs", styles: ["Boho", "Scandinavian"], palette: ["beige", "oat"], rooms: ["living room", "bedroom", "dining room"], io: "indoor", price: 179, photo: "1600166898405-da9535204843", quality: "Natural fibers, hand-braided", variants: ["5x8", "8x10"] },
  { key: "vintage-wool-rug", title: "Vintage-Wash Wool Rug", category: "rugs", styles: ["Traditional", "Mid-Century Modern"], palette: ["rust", "terracotta", "navy"], rooms: ["living room", "dining room", "bedroom"], io: "indoor", price: 329, photo: "1575414003591-ece8d0416c7a", quality: "Low pile, high traffic friendly", variants: ["5x8", "8x10", "9x12"] },
  { key: "outdoor-stripe-rug", title: "Striped Outdoor Rug", category: "rugs", styles: ["Boho", "Minimalist"], palette: ["navy", "cream"], rooms: ["patio", "balcony"], io: "outdoor", price: 99, photo: "1600210492486-724fe5c67fb0", quality: "UV and mildew resistant", variants: ["4x6", "6x9"] },
  { key: "arc-floor-lamp", title: "Brass Arc Floor Lamp", category: "lighting", styles: ["Mid-Century Modern", "Industrial"], palette: ["brass", "black"], rooms: ["living room"], io: "indoor", price: 219, photo: "1507473885765-e6ed057f782c", quality: "Dimmable, weighted marble base", variants: ["Brass", "Matte black"] },
  { key: "paper-pendant", title: "Paper Lantern Pendant", category: "lighting", styles: ["Scandinavian", "Minimalist"], palette: ["white", "cream"], rooms: ["living room", "bedroom", "dining room"], io: "indoor", price: 89, photo: "1513506003901-1e6a229e2d15", quality: "Hand-pleated rice paper", variants: ["Small", "Large"] },
  { key: "cage-sconce", title: "Cage Wall Sconce", category: "lighting", styles: ["Industrial"], palette: ["black", "charcoal"], rooms: ["bedroom", "hallway", "living room"], io: "both", price: 74, photo: "1524484485831-a92ffc0de03f", quality: "Damp-rated, plug-in option", variants: ["Black", "Bronze"] },
  { key: "abstract-print", title: "Earth-Tone Abstract Print", category: "wall art", styles: ["Boho", "Mid-Century Modern"], palette: ["terracotta", "beige", "rust"], rooms: ["living room", "bedroom"], io: "indoor", price: 129, photo: "1578500494198-246f612d3b3d", quality: "Archival ink, oak frame", variants: ["18x24", "24x36"] },
  { key: "landscape-canvas", title: "Quiet Landscape Canvas", category: "wall art", styles: ["Traditional", "Scandinavian"], palette: ["sage", "cream", "green"], rooms: ["living room", "bedroom", "dining room"], io: "indoor", price: 165, photo: "1513519245088-0e12902e5a38", quality: "Gallery-wrapped canvas", variants: ["24x30", "30x40"] },
  { key: "round-mirror", title: "Round Brass Mirror", category: "mirrors", styles: ["Mid-Century Modern", "Minimalist"], palette: ["brass"], rooms: ["living room", "hallway", "bedroom", "bathroom"], io: "indoor", price: 149, photo: "1618220179428-22790b461013", quality: "Beveled glass, steel frame", variants: ["24 in", "30 in"] },
  { key: "arched-floor-mirror", title: "Arched Floor Mirror", category: "mirrors", styles: ["Boho", "Traditional"], palette: ["black", "walnut"], rooms: ["bedroom", "hallway"], io: "indoor", price: 259, photo: "1616486338812-3dadae4b4ace", quality: "Shatter-resistant backing", variants: ["Black", "Walnut"] },
  { key: "oval-coffee-table", title: "Oval Walnut Coffee Table", category: "tables", styles: ["Mid-Century Modern"], palette: ["walnut"], rooms: ["living room"], io: "indoor", price: 299, photo: "1532372320572-cda25653a26d", quality: "Walnut veneer, tapered legs", variants: ["Walnut"] },
  { key: "steel-side-table", title: "Steel & Oak Side Table", category: "tables", styles: ["Industrial", "Minimalist"], palette: ["black", "oat"], rooms: ["living room", "bedroom"], io: "indoor", price: 119, photo: "1503602642458-232111445657", quality: "Powder-coated steel", variants: ["Black / Oak"] },
  { key: "teak-patio-table", title: "Teak Patio Bistro Table", category: "tables", styles: ["Traditional", "Scandinavian"], palette: ["walnut", "beige"], rooms: ["patio", "balcony"], io: "outdoor", price: 239, photo: "1600585154340-be6161a56a0c", quality: "Grade-A teak, weatherproof", variants: ["Natural"] },
  { key: "credenza", title: "Slatted Media Credenza", category: "storage", styles: ["Mid-Century Modern", "Scandinavian"], palette: ["walnut", "oat"], rooms: ["living room", "bedroom"], io: "indoor", price: 549, photo: "1594026112284-02bb6f3352fe", quality: "Soft-close doors, cable cutouts", variants: ["Walnut", "Oak"] },
  { key: "woven-baskets", title: "Woven Storage Baskets, Set of 3", category: "storage", styles: ["Boho", "Scandinavian"], palette: ["beige", "oat"], rooms: ["living room", "bedroom", "bathroom"], io: "indoor", price: 59, photo: "1595428774223-ef52624120d2", quality: "Seagrass, sturdy handles", variants: ["Natural"] },
  { key: "linen-throw", title: "Stonewashed Linen Throw", category: "textiles", styles: ["Scandinavian", "Minimalist", "Boho"], palette: ["sage", "oat", "cream"], rooms: ["living room", "bedroom"], io: "indoor", price: 69, photo: "1540932239986-30128078f3c5", quality: "European flax, prewashed", variants: ["Sage", "Oat", "Terracotta"] },
  { key: "kilim-pillows", title: "Kilim Pillow Covers, Pair", category: "textiles", styles: ["Boho", "Traditional"], palette: ["rust", "terracotta", "navy"], rooms: ["living room", "bedroom"], io: "indoor", price: 48, photo: "1584100936595-c0654b55a2e2", quality: "Hand-loomed cotton wool", variants: ["20x20"] },
  { key: "fiddle-leaf", title: "Faux Fiddle Leaf Fig, 6 ft", category: "plants", styles: ["Boho", "Mid-Century Modern", "Scandinavian"], palette: ["green", "sage"], rooms: ["living room", "bedroom"], io: "indoor", price: 139, photo: "1485955900006-10f4d324d411", quality: "Realistic, no watering", variants: ["5 ft", "6 ft"] },
  { key: "olive-tree", title: "Potted Olive Tree", category: "plants", styles: ["Traditional", "Minimalist"], palette: ["sage", "green", "terracotta"], rooms: ["living room", "patio"], io: "both", price: 119, photo: "1463320726281-696a485928c7", quality: "Live plant, ships in nursery pot", variants: ["3 ft", "4 ft"] },
  { key: "ceramic-vases", title: "Matte Ceramic Vase Trio", category: "decor", styles: ["Minimalist", "Scandinavian"], palette: ["cream", "white", "sage"], rooms: ["living room", "bedroom", "dining room"], io: "indoor", price: 54, photo: "1612196808214-b8e1d6145a8c", quality: "Glazed stoneware", variants: ["Cream", "Sage"] },
  { key: "brass-candles", title: "Brass Candleholder Set", category: "decor", styles: ["Mid-Century Modern", "Traditional"], palette: ["brass"], rooms: ["dining room", "living room"], io: "indoor", price: 42, photo: "1602874801007-bd458bb1b8b6", quality: "Solid brass, lacquered", variants: ["Set of 3"] },
];

const MERCHANTS = ["Hearth & Grain", "Oak Lane Home", "Field Supply Co.", "Nest Theory", "Kindred Living"];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

let n = 9_100_000_000;
function makeOffer(b: Base, merchantIdx: number, variant: 0 | 1): Product {
  const id = `gid://shopify/Product/${n++}`;
  const merchant = MERCHANTS[merchantIdx % MERCHANTS.length] ?? "Hearth & Grain";
  // Deterministic variation between merchants.
  const priceShift = variant === 0 ? 1 : 0.93 + ((merchantIdx * 7) % 15) / 100;
  const price = Math.round(b.price * priceShift);
  const onSale = (b.key.length + merchantIdx + variant) % 3 === 0;
  const compare = onSale ? Math.round(price / 0.8) : null;
  const discount = compare ? Math.round((1 - price / compare) * 100) : 0;
  const rating = Math.round((3.7 + ((b.key.length * (merchantIdx + 3)) % 13) / 10) * 10) / 10;
  const variants: Variant[] = b.variants.map((label, i) => ({
    id: `gid://shopify/ProductVariant/${n}${i}`,
    label,
    price: Math.round(price * (1 + i * 0.12)),
  }));
  return {
    id,
    product_key: b.key,
    title: b.title,
    merchant,
    category: b.category,
    style_tags: b.styles,
    palette_tags: b.palette,
    room_types: b.rooms,
    indoor_outdoor: b.io,
    price,
    compare_at_price: compare,
    discount_percent: discount,
    rating: Math.min(rating, 4.9),
    review_count: 20 + ((b.key.length * 37 + merchantIdx * 113) % 900),
    quality_note: b.quality,
    in_stock: (b.key.length + merchantIdx) % 7 !== 0,
    ships_to: merchantIdx % 4 === 3 ? ["US"] : ["US", "CA"],
    image_url: u(b.photo),
    continue_url: `https://${slug(merchant)}.example.com/checkouts/c/${slug(b.key)}-${variant}`,
    return_policy: merchantIdx % 5 === 4 ? null : merchantIdx % 2 ? "Free 30-day returns" : "60-day returns, $15 restocking",
    requires_review: b.key === "linen-sofa" && variant === 1,
    variants,
  };
}

export const CATALOG: Product[] = BASES.flatMap((b, i) => [
  makeOffer(b, i, 0),
  ...(i < 16 ? [makeOffer(b, i + 2, 1)] : []),
]);

export type SearchCatalogRequest = {
  catalog: {
    query: string;
    filters: { ships_to: { country: string }; available: boolean };
  };
};

/** Mirrors Shopify's search_catalog: query + filters, results grouped by product key. */
export function searchCatalog(req: SearchCatalogRequest): ProductGroup[] {
  const { query, filters } = req.catalog;
  const terms = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const hits = CATALOG.filter((p) => {
    if (!p.ships_to.includes(filters.ships_to.country)) return false;
    if (filters.available && !p.in_stock) return false;
    if (!terms.length) return true;
    const hay = [p.title, p.category, ...p.style_tags, ...p.palette_tags, ...p.room_types].join(" ").toLowerCase();
    return terms.some((t) => hay.includes(t));
  });
  const groups = new Map<string, Product[]>();
  for (const p of hits) groups.set(p.product_key as string, [...(groups.get(p.product_key) ?? []), p]);
  return Array.from(groups, ([product_key, offers]) => ({ product_key, offers }));
}

/** Mirrors Shopify's get_product: full product with variants. */
export function getProduct(id: string): Product | null {
  return CATALOG.find((p) => p.id === id) ?? null;
}
