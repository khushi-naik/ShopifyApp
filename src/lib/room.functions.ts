import { createServerFn } from "@tanstack/react-start";
import type { Brief, Mode, Product, RankedMatch, VibeRead } from "./room-types";
import { mockVibe } from "./mock-vibe";
import { neededCategories, rankGroups } from "./ranking";

export const analyzeRoom = createServerFn({ method: "POST" })
  .inputValidator((d: { image: string; mode: Mode; colors: string[] }) => {
    if (typeof d?.image !== "string" || !d.image.startsWith("data:image/")) throw new Error("Invalid image");
    if (d.image.length > 4_000_000) throw new Error("Image too large");
    return { image: d.image, mode: d.mode === "refresh" ? "refresh" : "empty", colors: (d.colors ?? []).slice(0, 4) } as const;
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
    const query = neededCategories(brief, vibe).join(" ");
    const groups = searchCatalog({
      catalog: { query, filters: { ships_to: { country: "US" }, available: brief.inStock } },
    });
    return rankGroups(groups, brief, vibe);
  });

export const fetchProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<Product | null> => {
    const { getProduct } = await import("./catalog.server");
    return getProduct(data.id);
  });
