import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { CATEGORIES, STYLES, type VibeRead } from "./room-types";

const schema = z.object({
  room_type: z.string(),
  indoor_outdoor: z.enum(["indoor", "outdoor"]),
  space_state: z.enum(["empty", "furnished"]),
  primary_style: z.enum(STYLES),
  secondary_style: z.enum(STYLES),
  palette_name: z.string(),
  palette: z.array(z.object({ name: z.string(), hex: z.string() })),
  gaps: z.array(z.object({ area: z.string(), suggestion: z.string(), category: z.enum(CATEGORIES) })),
  keep: z.array(z.object({ item: z.string(), color_hex: z.string() })),
  swaps: z.array(z.object({ current: z.string(), suggestion: z.string(), category: z.enum(CATEGORIES) })),
});

const INSTRUCTIONS = `You are a warm, practical interior stylist. Read the room photo and return the structured vibe read.
- room_type: short, lowercase (e.g. "living room", "bedroom", "patio").
- palette: 3-4 colors seen in the room, each with a friendly name and a #RRGGBB hex. palette_name like "Earthy Brown & Beige".
- If the room is mostly empty: space_state "empty", 1-3 gaps (area = the open area, e.g. "bare wall above the radiator"; suggestion = what would fill it, e.g. "art or a mirror"), keep and swaps empty.
- If furnished: space_state "furnished", 1-3 keep pieces (with their main color hex) and 1-3 swaps (current = the piece to replace, suggestion = what to swap in), gaps empty.
- Choose each gap/swap category from the allowed list.`;

export async function analyzeWithAI(image: string, mode: "empty" | "refresh"): Promise<Omit<VibeRead, "demo">> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    output: Output.object({ schema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `The shopper chose "${mode === "empty" ? "Fill an empty space" : "Refresh a room I have"}". Analyze this room.`,
          },
          { type: "image", image },
        ],
      },
    ],
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const out = await result.output;
  return {
    ...out,
    palette: out.palette.slice(0, 4),
    gaps: out.gaps.slice(0, 3),
    keep: out.keep.slice(0, 3),
    swaps: out.swaps.slice(0, 3),
  };
}
