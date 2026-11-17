export type Mode = "empty" | "refresh";
export const STYLES = [
  "Mid-Century Modern",
  "Boho",
  "Minimalist",
  "Scandinavian",
  "Traditional",
  "Industrial",
] as const;
export type Style = (typeof STYLES)[number];

export const CATEGORIES = [
  "seating",
  "rugs",
  "lighting",
  "wall art",
  "mirrors",
  "tables",
  "storage",
  "textiles",
  "plants",
  "decor",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type PaletteColor = { name: string; hex: string };
export type Gap = { area: string; suggestion: string; category: Category };
export type KeepPiece = { item: string; color_hex: string };
export type Swap = { current: string; suggestion: string; category: Category };

export type VibeRead = {
  room_type: string;
  indoor_outdoor: "indoor" | "outdoor";
  space_state: "empty" | "furnished";
  primary_style: Style;
  secondary_style: Style;
  palette_name: string;
  palette: PaletteColor[];
  gaps: Gap[];
  keep: KeepPiece[];
  swaps: Swap[];
  demo: boolean;
};

export type Goal = "specific" | "whole" | "decide";
export type Brief = {
  goal: Goal;
  category: Category;
  budget: number;
  spaceWidth: number | null;
  inStock: boolean;
  rated4: boolean;
  onSale: boolean;
  setting: "indoor" | "outdoor";
};

export type Variant = {
  id: string;
  label: string;
  price: number;
  compare_at_price?: number | null;
  discount_percent?: number;
  available?: boolean;
  product_url?: string | null;
  checkout_url?: string | null;
};

export type Product = {
  id: string;
  product_key: string;
  title: string;
  merchant: string;
  category: Category;
  style_tags: Style[];
  palette_tags: string[];
  room_types: string[];
  indoor_outdoor: "indoor" | "outdoor" | "both" | "unknown";
  width: number | null;
  price: number;
  compare_at_price: number | null;
  discount_percent: number;
  rating: number | null;
  review_count: number | null;
  quality_note: string;
  in_stock: boolean;
  ships_to: string[];
  image_url: string;
  continue_url?: string | null;
  product_url?: string | null;
  return_policy: string | null;
  requires_review: boolean;
  variants: Variant[];
};

export type ProductGroup = { product_key: string; offers: Product[] };

export type RankedMatch = {
  product: Product;
  otherOffers: number;
  score: number;
  reasons: string[];
};

export type CartLine = { product: Product; variant: Variant; qty: number };

/** Named color tags used to compare a room's palette to catalog products. */
export const PALETTE_TAGS: Record<string, [number, number, number]> = {
  cream: [240, 232, 214],
  white: [245, 245, 242],
  beige: [214, 196, 168],
  oat: [200, 184, 156],
  walnut: [110, 72, 44],
  terracotta: [190, 100, 70],
  rust: [160, 82, 45],
  sage: [150, 168, 136],
  green: [70, 110, 70],
  navy: [40, 52, 90],
  charcoal: [60, 60, 62],
  black: [20, 20, 20],
  brass: [181, 150, 80],
  gray: [150, 150, 150],
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0) as [
    number,
    number,
    number,
  ];
}

export function nearestTag(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  let best = "beige";
  let bestD = Infinity;
  for (const [tag, [tr, tg, tb]] of Object.entries(PALETTE_TAGS)) {
    const d = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = tag;
    }
  }
  return best;
}
