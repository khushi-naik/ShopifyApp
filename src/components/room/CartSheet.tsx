import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  beforeYouBuy,
  computeSession,
  type Address,
  type ShippingOption,
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

const EMPTY_ADDRESS: Address = {
  name: "",
  line1: "",
  city: "",
  postal: "",
  country: "US",
};

type Panel = "cart" | "checkout" | "complete";

export function CartSheet({
  open,
  onOpenChange,
  lines,
  onQuantityChange,
  onRemove,
  vibe,
  brief,
}: Props) {
  const [panel, setPanel] = useState<Panel>("cart");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [shipping, setShipping] = useState<ShippingOption>(null);

  const subtotal = lines.reduce(
    (sum, line) => sum + line.variant.price * line.qty,
    0,
  );
  const checkout = computeSession(lines, address, shipping);
  const checklist =
    vibe && brief ? beforeYouBuy(lines, vibe, brief, address) : [];

  const changeAddress = <K extends keyof Address>(
    key: K,
    value: Address[K],
  ) => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setPanel("cart");
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex h-full w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-border pb-5 pr-8 text-left">
          <div className="flex items-center gap-2">
            {panel !== "cart" && (
              <Button
                size="icon"
                variant="ghost"
                className="-ml-2 h-8 w-8 rounded-full"
                aria-label={
                  panel === "complete" ? "Back to checkout" : "Back to cart"
                }
                onClick={() =>
                  setPanel(panel === "complete" ? "checkout" : "cart")
                }
              >
                <ArrowLeft />
              </Button>
            )}
            <div>
              <SheetTitle className="text-2xl">
                {panel === "cart"
                  ? "Your cart"
                  : panel === "checkout"
                    ? "Checkout details"
                    : "All set"}
              </SheetTitle>
              <SheetDescription className="mt-1">
                {panel === "cart"
                  ? `${lines.reduce((count, line) => count + line.qty, 0)} ${
                      lines.reduce((count, line) => count + line.qty, 0) === 1
                        ? "piece"
                        : "pieces"
                    } picked for your space`
                  : panel === "checkout"
                    ? "Check delivery, shipping and the details before you buy."
                    : "Your demo checkout is ready to hand off."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {panel === "cart" && (
          <>
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
                lines.map(({ product, variant, qty }) => (
                  <article
                    key={`${product.id}-${variant.id}`}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-3"
                  >
                    <img
                      src={product.image_url}
                      alt=""
                      className="h-24 w-24 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold leading-snug">
                            {product.title}
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {product.merchant} · {variant.label}
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
                              onQuantityChange(product.id, variant.id, qty - 1)
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
                              onQuantityChange(product.id, variant.id, qty + 1)
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
                ))
              )}
            </div>

            {lines.length > 0 && (
              <div className="space-y-4 border-t border-border pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">{money(subtotal)}</span>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  Standard shipping is free on orders over $150.
                </p>
                <Button
                  className="w-full rounded-full"
                  onClick={() => setPanel("checkout")}
                >
                  Continue to checkout <span aria-hidden="true">→</span>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Taxes and delivery are estimated in the next step.
                </p>
              </div>
            )}
          </>
        )}

        {panel === "checkout" && (
          <div className="flex-1 space-y-6 overflow-y-auto py-5">
            <section
              className="space-y-4"
              aria-labelledby="shipping-address-title"
            >
              <div>
                <h2 id="shipping-address-title" className="font-semibold">
                  Shipping address
                </h2>
                <p className="text-sm text-muted-foreground">
                  Where should your finds go?
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="checkout-name">Full name</Label>
                  <Input
                    id="checkout-name"
                    autoComplete="name"
                    value={address.name}
                    onChange={(event) =>
                      changeAddress("name", event.target.value)
                    }
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="checkout-address">Street address</Label>
                  <Input
                    id="checkout-address"
                    autoComplete="street-address"
                    value={address.line1}
                    onChange={(event) =>
                      changeAddress("line1", event.target.value)
                    }
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-city">City</Label>
                  <Input
                    id="checkout-city"
                    autoComplete="address-level2"
                    value={address.city}
                    onChange={(event) =>
                      changeAddress("city", event.target.value)
                    }
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-postal">ZIP / postal code</Label>
                  <Input
                    id="checkout-postal"
                    autoComplete="postal-code"
                    value={address.postal}
                    onChange={(event) =>
                      changeAddress("postal", event.target.value)
                    }
                    placeholder="Postal code"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="checkout-country">Country</Label>
                  <select
                    id="checkout-country"
                    autoComplete="country"
                    value={address.country}
                    onChange={(event) =>
                      changeAddress(
                        "country",
                        event.target.value as Address["country"],
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
              </div>
            </section>

            <section
              className="space-y-3"
              aria-labelledby="shipping-method-title"
            >
              <div>
                <h2 id="shipping-method-title" className="font-semibold">
                  Shipping method
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose how you’d like it delivered.
                </p>
              </div>
              <RadioGroup
                value={shipping ?? ""}
                onValueChange={(value) =>
                  setShipping(
                    value === "standard" || value === "express" ? value : null,
                  )
                }
                className="gap-2"
              >
                <Label
                  htmlFor="shipping-standard"
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <span className="flex items-center gap-3">
                    <RadioGroupItem id="shipping-standard" value="standard" />
                    <span>
                      <span className="block font-medium">Standard</span>
                      <span className="text-xs text-muted-foreground">
                        5–8 business days
                      </span>
                    </span>
                  </span>
                  <span className="text-sm">
                    {subtotal >= 150 ? "Free" : money(9.95)}
                  </span>
                </Label>
                <Label
                  htmlFor="shipping-express"
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <span className="flex items-center gap-3">
                    <RadioGroupItem id="shipping-express" value="express" />
                    <span>
                      <span className="block font-medium">Express</span>
                      <span className="text-xs text-muted-foreground">
                        2–3 business days
                      </span>
                    </span>
                  </span>
                  <span className="text-sm">{money(24.95)}</span>
                </Label>
              </RadioGroup>
            </section>

            {lines.some((line) => line.product.requires_review) && (
              <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                <p>
                  <span className="font-semibold">
                    A merchant needs to review an item.
                  </span>{" "}
                  It can stay in your cart, but that seller must confirm
                  availability and terms before a real purchase.
                </p>
              </div>
            )}

            {checklist.length > 0 && (
              <section className="space-y-3" aria-labelledby="before-buy-title">
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

            <section
              className="space-y-2 border-t border-border pt-4"
              aria-label="Order total"
            >
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{money(checkout.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>
                  {shipping ? money(checkout.shipping) : "Choose a method"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated tax</span>
                <span>{shipping ? money(checkout.tax) : "—"}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-semibold">
                <span>Total</span>
                <span>
                  {shipping ? money(checkout.total) : money(checkout.subtotal)}
                </span>
              </div>
            </section>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Checkout status</span>
                <Badge
                  variant={
                    checkout.status === "ready_for_complete"
                      ? "default"
                      : "secondary"
                  }
                >
                  {checkout.status === "ready_for_complete"
                    ? "Ready"
                    : "Incomplete"}
                </Badge>
              </div>
              {checkout.missing.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Still needed: {checkout.missing.join(" and ").toLowerCase()}.
                </p>
              )}
              <Button
                className="w-full rounded-full"
                disabled={checkout.status !== "ready_for_complete"}
                onClick={() => setPanel("complete")}
              >
                Prepare demo checkout
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                This catalog is a demo. No order or payment will be submitted.
              </p>
            </div>
          </div>
        )}

        {panel === "complete" && (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
            <span className="rounded-full bg-accent p-5 text-accent-foreground">
              <Check className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold">
              Your checkout is ready
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Your cart, delivery choice and pre-purchase checks are complete. A
              live store would now hand this order to the merchant for payment
              and fulfillment.
            </p>
            {lines.some((line) => line.product.requires_review) && (
              <Badge variant="warn" className="mt-4">
                Merchant review still required
              </Badge>
            )}
            <Button
              className="mt-6 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Return to your room
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
