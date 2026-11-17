import type { Brief, CartLine, VibeRead } from "./room-types";

export function secureHttpsUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function checkoutHandoffUrl(line: CartLine): string | null {
  for (const candidate of [
    line.variant.checkout_url,
    line.product.continue_url,
    line.product.product_url,
  ]) {
    const url = secureHttpsUrl(candidate);
    if (url) return url;
  }
  return null;
}

export function beforeYouBuy(
  lines: CartLine[],
  vibe: VibeRead,
  brief: Brief,
  country: string,
) {
  const styles = [vibe.primary_style, vibe.secondary_style];
  const offStyle = lines.filter(
    (line) => !line.product.style_tags.some((style) => styles.includes(style)),
  );
  const overBudget = lines.filter((line) => line.variant.price > brief.budget);
  const noShip = lines.filter(
    (line) => !line.product.ships_to.includes(country),
  );
  const noReturns = lines.filter((line) => !line.product.return_policy);
  const names = (matchingLines: CartLine[]) =>
    matchingLines.map((line) => line.product.title).join(", ");
  const spaceWidth = brief.spaceWidth;
  const spaceCheck =
    spaceWidth === null
      ? null
      : (() => {
          const tooBig = lines.filter(
            (line) =>
              line.product.width !== null && line.product.width > spaceWidth,
          );
          const sizeUnknown = lines.filter(
            (line) => line.product.width === null,
          );
          const details = [
            tooBig.length ? `Too big: ${names(tooBig)}` : "",
            sizeUnknown.length
              ? `Size not listed; check with seller: ${names(sizeUnknown)}`
              : "",
          ].filter(Boolean);
          return {
            label: "Fits your space",
            ok: !tooBig.length && !sizeUnknown.length,
            detail:
              details.join("; ") || `All items fit within ${spaceWidth} inches`,
          };
        })();

  return [
    {
      label: "Fits your room style",
      ok: !offStyle.length,
      detail: offStyle.length
        ? `Check: ${names(offStyle)}`
        : `All pieces suit ${vibe.primary_style}`,
    },
    {
      label: "Fits your budget",
      ok: !overBudget.length,
      detail: overBudget.length
        ? `Over $${brief.budget}: ${names(overBudget)}`
        : `Every piece is under $${brief.budget}`,
    },
    ...(spaceCheck ? [spaceCheck] : []),
    {
      label: "Delivers to your location",
      ok: !noShip.length,
      detail: noShip.length
        ? `Doesn't ship to ${country}: ${names(noShip)}`
        : `All merchants ship to ${country}`,
    },
    {
      label: "Return policy shown",
      ok: !noReturns.length,
      detail: noReturns.length
        ? `No policy listed: ${names(noReturns)}`
        : "Every merchant lists returns",
    },
  ];
}
