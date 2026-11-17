import {
  Check,
  CircleAlert,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  beforeYouBuy,
  checkoutHandoffUrl,
  secureHttpsUrl,
} from "@/lib/checkout";
import { money } from "@/lib/image-utils";
import type { Brief, CartLine, VibeRead } from "@/lib/room-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  onQuantityChange: (
    productId: string,
    variantId: string,
    quantity: number,
  ) => void;
  onRemove: (productId: string, variantId: string) => void;
  vibe: VibeRead | null;
  brief: Brief | null;
};

export function CartSheet({
  open,
  onOpenChange,
  lines,
  onQuantityChange,
  onRemove,
  vibe,
  brief,
}: Props) {
  const itemsSubtotal = lines.reduce(
    (sum, line) => sum + line.variant.price * line.qty,
    0,
  );
  const checklist = vibe && brief ? beforeYouBuy(lines, vibe, brief, "US") : [];

  const linesByMerchant = new Map<string, CartLine[]>();
  for (const line of lines) {
    const merchantLines = linesByMerchant.get(line.product.merchant) ?? [];
    merchantLines.push(line);
    linesByMerchant.set(line.product.merchant, merchantLines);
  }

  const merchantGroups = Array.from(
    linesByMerchant,
    ([merchant, groupLines]) => {
      const firstLine = groupLines[0];
      const returnPolicy =
        groupLines
          .map((line) => line.product.return_policy)
          .find((policy) => Boolean(policy)) ?? null;

      return {
        merchant,
        lines: groupLines,
        subtotal: groupLines.reduce(
          (sum, line) => sum + line.variant.price * line.qty,
          0,
        ),
        checkoutUrl: firstLine ? checkoutHandoffUrl(firstLine) : null,
        returnPolicy,
        returnPolicyUrl: secureHttpsUrl(returnPolicy),
      };
    },
  );

  const pieceCount = lines.reduce((count, line) => count + line.qty, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-border pb-5 pr-8 text-left">
          <SheetTitle className="text-2xl">Your cart</SheetTitle>
          <SheetDescription className="mt-1">
            {pieceCount} {pieceCount === 1 ? "piece" : "pieces"} picked for your
            space
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-5">
          {!lines.length ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="rounded-full bg-accent p-4 text-accent-foreground">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">
                Your cart is waiting for a good fit
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a piece from your room matches and it’ll show up here.
              </p>
              <Button
                className="mt-5 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                Keep exploring
              </Button>
            </div>
          ) : (
            <>
              {merchantGroups.map((group) => (
                <section
                  key={group.merchant}
                  className="space-y-3 rounded-2xl border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold">{group.merchant}</h2>
                    <p className="shrink-0 text-sm">
                      Subtotal{" "}
                      <span className="font-semibold">
                        {money(group.subtotal)}
                      </span>
                    </p>
                  </div>

                  {group.lines.map(({ product, variant, qty }) => (
                    <article
                      key={`${product.id}-${variant.id}`}
                      className="flex gap-4 rounded-xl bg-muted/50 p-3"
                    >
                      <img
                        src={product.image_url}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium leading-snug">
                              {product.title}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {variant.label}
                            </p>
                          </div>
                          <p className="shrink-0 font-semibold">
                            {money(variant.price * qty)}
                          </p>
                        </div>
                        {product.requires_review && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
                            <CircleAlert className="h-3.5 w-3.5" />
                            Merchant review needed before purchase
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-full"
                              aria-label={`Decrease quantity of ${product.title}`}
                              onClick={() =>
                                onQuantityChange(
                                  product.id,
                                  variant.id,
                                  qty - 1,
                                )
                              }
                            >
                              <Minus />
                            </Button>
                            <span
                              className="min-w-5 text-center text-sm"
                              aria-label={`Quantity ${qty}`}
                            >
                              {qty}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-full"
                              aria-label={`Increase quantity of ${product.title}`}
                              onClick={() =>
                                onQuantityChange(
                                  product.id,
                                  variant.id,
                                  qty + 1,
                                )
                              }
                            >
                              <Plus />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => onRemove(product.id, variant.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {group.returnPolicy &&
                    (group.returnPolicyUrl ? (
                      <a
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        href={group.returnPolicyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Refund policy <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Refund policy: {group.returnPolicy}
                      </p>
                    ))}

                  {group.checkoutUrl ? (
                    <Button asChild className="w-full rounded-full">
                      <a
                        href={group.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Check out at {group.merchant}
                        <ExternalLink />
                      </a>
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="w-full rounded-full"
                        disabled
                        aria-disabled="true"
                      >
                        Check out at {group.merchant}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Checkout link unavailable
                      </p>
                    </>
                  )}
                </section>
              ))}

              {checklist.length > 0 && (
                <section
                  className="space-y-3 rounded-2xl border border-border p-4"
                  aria-labelledby="before-buy-title"
                >
                  <div>
                    <h2 id="before-buy-title" className="font-semibold">
                      Before you buy
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      A quick check against your room brief.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {checklist.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm"
                      >
                        {item.ok ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                        )}
                        <span>
                          <span className="font-medium">{item.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {item.detail}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between text-sm">
              <span>Items subtotal</span>
              <span className="font-semibold">{money(itemsSubtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll check out with {merchantGroups.length}{" "}
              {merchantGroups.length === 1 ? "store" : "stores"}. Shipping and
              tax are set by each store.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
