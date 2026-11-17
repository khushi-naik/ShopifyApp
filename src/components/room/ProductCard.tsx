import { useState } from "react";
import { Check, ExternalLink, ShoppingBag, Star, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { money } from "@/lib/image-utils";
import type { RankedMatch, Variant } from "@/lib/room-types";

export function ProductCard({
  match,
  budget,
  spaceWidth,
  onAdd,
}: {
  match: RankedMatch;
  budget: number;
  spaceWidth: number | null;
  onAdd: (v: Variant) => void;
}) {
  const p = match.product;
  const [variantId, setVariantId] = useState<string>(
    p.variants.find((option) => option.available)?.id ??
      p.variants[0]?.id ??
      "",
  );
  const affordableVariants = p.variants.filter((v) => v.price <= budget);
  const variant =
    affordableVariants.find((v) => v.id === variantId) ?? affordableVariants[0];
  const useCaseLabel =
    p.indoor_outdoor === "both"
      ? "Indoor & outdoor"
      : p.indoor_outdoor === "unknown"
        ? "Use not specified"
        : p.indoor_outdoor;
  const compareAt = variant?.compare_at_price ?? p.compare_at_price;
  const discountPercent = variant?.discount_percent ?? p.discount_percent;

  return (
    <Card className="animate-rise flex flex-col overflow-hidden rounded-3xl transition hover:shadow-soft">
      <div className="relative">
        <img
          src={p.image_url}
          alt={p.title}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
        {discountPercent > 0 && (
          <Badge variant="sale" className="absolute left-3 top-3">
            {discountPercent}% off
          </Badge>
        )}
        <Badge variant="soft" className="absolute bottom-3 right-3 capitalize">
          {useCaseLabel}
        </Badge>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-semibold leading-snug">{p.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Store className="h-3.5 w-3.5" /> {p.merchant}
            {match.otherOffers > 0 && (
              <span>
                · +{match.otherOffers} more{" "}
                {match.otherOffers === 1 ? "seller" : "sellers"}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold">
            {money(variant?.price ?? p.price)}
          </span>
          {compareAt && compareAt > (variant?.price ?? p.price) && (
            <s className="text-sm text-muted-foreground">{money(compareAt)}</s>
          )}
        </div>
        {spaceWidth !== null && (
          <p
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              p.width === null
                ? "bg-muted text-muted-foreground"
                : p.width <= spaceWidth
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
            }`}
            role="status"
          >
            {p.width === null
              ? "Size not listed, check with seller"
              : p.width <= spaceWidth
                ? "Fits"
                : "Too big for your space"}
          </p>
        )}
        <p className="flex items-center gap-1 text-sm">
          {p.rating !== null ? (
            <>
              <Star className="h-4 w-4 fill-warning text-warning" />
              {p.rating.toFixed(1)}
              <span className="text-muted-foreground">
                (
                {p.review_count === null
                  ? "review count unavailable"
                  : `${p.review_count.toLocaleString()} reviews`}
                )
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Rating unavailable</span>
          )}
        </p>
        {p.quality_note && (
          <p className="text-sm text-muted-foreground">{p.quality_note}</p>
        )}
        <div className="rounded-xl bg-muted p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Why this fits
          </p>
          <ul className="space-y-1">
            {match.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto space-y-2">
          {affordableVariants.length > 1 && (
            <Select value={variantId} onValueChange={setVariantId}>
              <SelectTrigger aria-label="Choose option">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {affordableVariants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label} · {money(v.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            className="w-full rounded-full"
            disabled={!variant || variant.available === false}
            onClick={() => variant && onAdd(variant)}
          >
            <ShoppingBag className="h-4 w-4" />
            {variant?.available === false
              ? "Currently unavailable"
              : "Add to cart"}
          </Button>
          {(p.product_url || p.continue_url) && (
            <a
              className="inline-flex w-full items-center justify-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href={p.product_url ?? p.continue_url ?? undefined}
              target="_blank"
              rel="noreferrer"
            >
              View at seller <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
