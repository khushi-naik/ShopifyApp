import type { Brief, CartLine, VibeRead } from "./room-types";

export type Address = {
  name: string;
  line1: string;
  city: string;
  postal: string;
  country: "US" | "CA";
};
export type ShippingOption = "standard" | "express" | null;
export type SessionStatus = "incomplete" | "ready_for_complete";

export const FREE_SHIPPING_MIN = 150;

export function shippingCost(option: ShippingOption, subtotal: number): number {
  if (option === "express") return 24.95;
  if (option === "standard") return subtotal >= FREE_SHIPPING_MIN ? 0 : 9.95;
  return 0;
}

export function addressComplete(a: Address): boolean {
  return [a.name, a.line1, a.city, a.postal].every((v) => v.trim().length > 1);
}

export function computeSession(
  lines: CartLine[],
  address: Address,
  option: ShippingOption,
) {
  const subtotal = lines.reduce((s, l) => s + l.variant.price * l.qty, 0);
  const shipping = shippingCost(option, subtotal);
  const tax = Math.round((subtotal + shipping) * 0.08 * 100) / 100;
  const missing: string[] = [];
  if (!addressComplete(address)) missing.push("Shipping address");
  if (!option) missing.push("Shipping option");
  const status: SessionStatus =
    lines.length && !missing.length ? "ready_for_complete" : "incomplete";
  return {
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
    missing,
    status,
  };
}

export function beforeYouBuy(
  lines: CartLine[],
  vibe: VibeRead,
  brief: Brief,
  address: Address,
) {
  const styles = [vibe.primary_style, vibe.secondary_style];
  const offStyle = lines.filter(
    (l) => !l.product.style_tags.some((s) => styles.includes(s)),
  );
  const overBudget = lines.filter((l) => l.variant.price > brief.budget);
  const noShip = lines.filter(
    (l) => !l.product.ships_to.includes(address.country),
  );
  const noReturns = lines.filter((l) => !l.product.return_policy);
  const names = (ls: CartLine[]) => ls.map((l) => l.product.title).join(", ");
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
        ? `Doesn't ship to ${address.country}: ${names(noShip)}`
        : `All merchants ship to ${address.country}`,
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
