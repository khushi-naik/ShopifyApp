import { createServerFn } from "@tanstack/react-start";
import type { Brief, Mode, RankedMatch, VibeRead } from "./room-types";
import { mockVibe } from "./mock-vibe";
import { neededCategories, rankGroups, targetPalette } from "./ranking";

export const analyzeRoom = createServerFn({ method: "POST" })
  .inputValidator((d: { image: string; mode: Mode; colors: string[] }) => {
    if (typeof d?.image !== "string" || !d.image.startsWith("data:image/"))
      throw new Error("Invalid image");
    if (d.image.length > 4_000_000) throw new Error("Image too large");
    return {
      image: d.image,
      mode: d.mode === "refresh" ? "refresh" : "empty",
      colors: (d.colors ?? []).slice(0, 4),
    } as const;
  })
  .handler(async ({ data }): Promise<VibeRead> => {
    try {
      const { analyzeWithAI } = await import("./vibe.server");
      return { ...(await analyzeWithAI(data.image, data.mode)), demo: false };
    } catch (e) {
      console.error("Vibe read failed, using demo analysis:", e);
      return mockVibe(data.colors, data.mode);
    }
  });

export const findMatches = createServerFn({ method: "POST" })
  .inputValidator((d: { brief: Brief; vibe: VibeRead }) => d)
  .handler(async ({ data }): Promise<RankedMatch[]> => {
    const { searchCatalog } = await import("./catalog.server");
    const { brief, vibe } = data;
    const categories = neededCategories(brief, vibe);
    const palette = targetPalette(vibe);
    const query = [
      categories.length ? categories.join(" ") : "home decor",
      vibe.room_type,
      vibe.primary_style,
      brief.setting,
      ...(brief.onSale ? ["on sale"] : []),
    ].join(" ");
    const intent = [
      `${brief.goal} decor recommendations`,
      `${brief.setting} use`,
      `room style: ${vibe.primary_style}`,
      `room type: ${vibe.room_type}`,
      `room colors: ${palette.join(", ")}`,
      brief.onSale ? "on sale" : "",
      brief.rated4 ? "rated at least 4 stars" : "",
      ...(vibe.space_state === "empty" ? vibe.gaps : vibe.swaps).map(
        (item) => item.suggestion,
      ),
    ]
      .filter(Boolean)
      .join("; ");
    const groups = await searchCatalog({
      catalog: {
        query,
        filters: {
          ships_to: { country: "US" },
          ...(brief.inStock ? { available: true } : {}),
          price: { max: Math.round(brief.budget * 100) },
          ...(brief.rated4
            ? { rating: { variant: { min: 4, min_count: 1 } } }
            : {}),
        },
        context: {
          address_country: "US",
          currency: "USD",
          intent,
        },
        pagination: { limit: 30 },
      },
    });
    return rankGroups(groups, brief, vibe);
  });
