import type { Mode, Style, VibeRead } from "./room-types";
import { hexToRgb } from "./room-types";

const NAMES: [string, [number, number, number]][] = [
  ["Warm Cream", [240, 230, 210]],
  ["Soft White", [245, 245, 242]],
  ["Sand Beige", [210, 190, 160]],
  ["Honey Oak", [190, 145, 95]],
  ["Walnut Brown", [110, 72, 44]],
  ["Terracotta", [190, 100, 70]],
  ["Sage Green", [150, 168, 136]],
  ["Forest Green", [70, 110, 70]],
  ["Slate Gray", [110, 115, 120]],
  ["Sky Blue", [150, 190, 225]],
  ["Charcoal", [55, 55, 58]],
];

function nameFor(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return NAMES.reduce((best, cur) => {
    const d = (c: [number, number, number]) => (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    return d(cur[1]) < d(best[1]) ? cur : best;
  })[0];
}

/** Deterministic fallback read built from the photo's dominant colors. */
export function mockVibe(colors: string[], mode: Mode): VibeRead {
  const hexes = (colors.length ? colors : ["#efe6d6", "#c9b08a", "#7a5a3c"]).slice(0, 4);
  const rgbs = hexes.map(hexToRgb);
  let r = 0, g = 0, b = 0;
  for (const c of rgbs) { r += c[0] / rgbs.length; g += c[1] / rgbs.length; b += c[2] / rgbs.length; }
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const warmth = r - b;
  let primary: Style = "Scandinavian";
  let secondary: Style = "Minimalist";
  if (lum < 0.35) [primary, secondary] = ["Industrial", "Mid-Century Modern"];
  else if (warmth > 40) [primary, secondary] = ["Mid-Century Modern", "Boho"];
  else if (warmth > 15) [primary, secondary] = ["Boho", "Scandinavian"];
  else if (lum > 0.75) [primary, secondary] = ["Minimalist", "Scandinavian"];

  const palette = hexes.map((hex) => ({ name: nameFor(hex), hex }));
  const empty = mode === "empty";
  return {
    room_type: "living room",
    indoor_outdoor: "indoor",
    space_state: empty ? "empty" : "furnished",
    primary_style: primary,
    secondary_style: secondary,
    palette_name: `${palette[0]?.name ?? "Warm"} & ${palette[Math.min(1, palette.length - 1)]?.name ?? "Neutral"}`,
    palette,
    gaps: empty
      ? [
          { area: "Bare main wall", suggestion: "large art or a round mirror", category: "wall art" },
          { area: "Open floor", suggestion: "a rug to anchor the room", category: "rugs" },
          { area: "Dark corner", suggestion: "a floor lamp or a tall plant", category: "lighting" },
        ]
      : [],
    keep: empty ? [] : [{ item: "Main sofa", color_hex: hexes[hexes.length - 1] ?? "#7a5a3c" }],
    swaps: empty
      ? []
      : [
          { current: "Dated floor lamp", suggestion: "a sculptural arc lamp", category: "lighting" },
          { current: "Plain pillows", suggestion: "textured throw and pillows", category: "textiles" },
        ],
    demo: true,
  };
}
