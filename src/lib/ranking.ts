import type {
  Brief,
  Category,
  ProductGroup,
  RankedMatch,
  VibeRead,
  Product,
} from "./room-types";
import { nearestTag } from "./room-types";

/** Categories the shopper needs, derived from the brief and the vibe read. */
export function neededCategories(brief: Brief, vibe: VibeRead): Category[] {
  if (brief.goal === "specific") return [brief.category];
  if (brief.goal === "decide") {
    const list = vibe.space_state === "empty" ? vibe.gaps : vibe.swaps;
    const cats = list.map((g) => g.category);
    return cats.length ? Array.from(new Set(cats)) : [];
  }
  return [];
}

/** Palette tags to match: the room palette, or the kept pieces in refresh mode. */
export function targetPalette(vibe: VibeRead): string[] {
  const hexes =
    vibe.space_state === "furnished" && vibe.keep.length
      ? vibe.keep.map((k) => k.color_hex)
      : vibe.palette.map((p) => p.hex);
  return Array.from(new Set(hexes.map(nearestTag)));
}

export function passesHardFilters(p: Product, brief: Brief): boolean {
  if (brief.setting === "indoor" && p.indoor_outdoor === "outdoor")
    return false;
  if (brief.setting === "outdoor" && p.indoor_outdoor === "indoor")
    return false;
  if (p.price > brief.budget) return false;
  if (brief.inStock && !p.in_stock) return false;
  if (brief.rated4 && p.rating < 4) return false;
  if (brief.onSale && p.discount_percent <= 0) return false;
  return true;
}

function gapLabel(cat: Category, vibe: VibeRead): string | null {
  const g = vibe.gaps.find((x) => x.category === cat);
  if (g && vibe.space_state === "empty")
    return `Fills the ${g.area.toLowerCase()}`;
  const s = vibe.swaps.find((x) => x.category === cat);
  if (s && vibe.space_state === "furnished")
    return `Upgrades the ${s.current.toLowerCase()}`;
  return null;
}

export function scoreProduct(p: Product, brief: Brief, vibe: VibeRead) {
  const reasons: { text: string; weight: number }[] = [];
  let score = 0;
  const needed = neededCategories(brief, vibe);

  if (needed.length && needed.includes(p.category)) {
    score += 3;
    const label = gapLabel(p.category, vibe);
    if (label) reasons.push({ text: label, weight: 5 });
  }
  if (p.style_tags.includes(vibe.primary_style)) {
    score += 3;
    reasons.push({ text: `Matches ${vibe.primary_style}`, weight: 4 });
  } else if (p.style_tags.includes(vibe.secondary_style)) {
    score += 1.5;
    reasons.push({ text: `Nods to ${vibe.secondary_style}`, weight: 2 });
  }
  const palette = targetPalette(vibe);
  const overlap = p.palette_tags.filter((t) => palette.includes(t));
  if (overlap.length) {
    score += Math.min(overlap.length, 3);
    reasons.push({
      text:
        vibe.space_state === "furnished"
          ? `Works with your ${overlap[0]} pieces`
          : `Picks up the ${overlap[0]} in your room`,
      weight: 3,
    });
  }
  const room = vibe.room_type.toLowerCase();
  const matchingRoom = p.room_types.find(
    (r) => room.includes(r) || r.includes(room),
  );
  if (matchingRoom) {
    score += 2;
    reasons.push({ text: `Suited to your ${matchingRoom}`, weight: 3.5 });
  }
  score += (p.rating - 3) * 1;
  score += Math.log10(Math.max(p.review_count, 1)) * 0.5;
  score += Math.max(0, 1 - p.price / brief.budget) * 2.5;
  if (p.quality_note.trim()) {
    score += 0.75;
    reasons.push({ text: "Quality details included", weight: 2 });
  }
  if (p.discount_percent > 0) {
    score += (p.discount_percent / 10) * 0.8;
    reasons.push({ text: `${p.discount_percent}% off right now`, weight: 2.5 });
  }
  if (p.price <= brief.budget * 0.75) {
    reasons.push({ text: "Good value under your budget", weight: 1.75 });
  } else if (p.price <= brief.budget) {
    reasons.push({ text: "Under budget", weight: 1 });
  }
  if (p.rating >= 4.5)
    reasons.push({
      text: `Rated ${p.rating} by ${p.review_count} buyers`,
      weight: 1.5,
    });

  reasons.sort((a, b) => b.weight - a.weight);
  return { score, reasons: reasons.slice(0, 3).map((r) => r.text) };
}

export function rankGroups(
  groups: ProductGroup[],
  brief: Brief,
  vibe: VibeRead,
  limit = 6,
): RankedMatch[] {
  const needed = neededCategories(brief, vibe);
  const ranked: RankedMatch[] = [];
  for (const g of groups) {
    const offers = g.offers.filter((o) => passesHardFilters(o, brief));
    if (!offers.length) continue;
    if (needed.length && !needed.includes(offers[0]!.category)) continue;
    const scored = offers
      .map((o) => ({ o, ...scoreProduct(o, brief, vibe) }))
      .sort((a, b) => b.score - a.score || a.o.price - b.o.price);
    const best = scored[0];
    if (!best) continue;
    ranked.push({
      product: best.o,
      otherOffers: offers.length - 1,
      score: best.score,
      reasons: best.reasons,
    });
  }
  ranked.sort((a, b) => b.score - a.score);
  if (brief.goal === "whole") {
    // Spread a whole-room plan across categories.
    const seen = new Set<string>();
    const spread = ranked.filter((r) =>
      seen.has(r.product.category) ? false : seen.add(r.product.category),
    );
    const rest = ranked.filter((r) => !spread.includes(r));
    return [...spread, ...rest].slice(0, limit);
  }
  return ranked.slice(0, limit);
}
