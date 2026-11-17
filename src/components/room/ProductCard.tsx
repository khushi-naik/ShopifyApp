import { useState } from "react";
import { Check, ShoppingBag, Star, Store } from "lucide-react";
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
import { fetchProduct } from "@/lib/room.functions";
import { money } from "@/lib/image-utils";
import type { RankedMatch, Variant } from "@/lib/room-types";

export function ProductCard({
  match,
  budget,
  onAdd,
}: {
  match: RankedMatch;
  budget: number;
  onAdd: (v: Variant) => void;
}) {
  const p = match.product;
  const [variants, setVariants] = useState<Variant[]>(p.variants);
  const [variantId, setVariantId] = useState<string>(p.variants[0]?.id ?? "");
  const affordableVariants = variants.filter((v) => v.price <= budget);
  const variant =
    affordableVariants.find((v) => v.id === variantId) ?? affordableVariants[0];

  const loadVariants = async (open: boolean) => {
    if (!open) return;
    const full = await fetchProduct({ data: { id: p.id } });
    if (full) {
      setVariants(full.variants);
      setVariantId((current) =>
        full.variants.some(
          (option) => option.id === current && option.price <= budget,
        )
          ? current
          : (full.variants.find((option) => option.price <= budget)?.id ?? ""),
      );
    }
  };

  return (
    <Card className="animate-rise flex flex-col overflow-hidden rounded-3xl transition hover:shadow-soft">
      <div className="relative">
        <img
          src={p.image_url}
          alt={p.title}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
        {p.discount_percent > 0 && (
          <Badge variant="sale" className="absolute left-3 top-3">
            {p.discount_percent}% off
          </Badge>
        )}
        <Badge variant="soft" className="absolute bottom-3 right-3 capitalize">
          {p.indoor_outdoor === "both" ? "Indoor & outdoor" : p.indoor_outdoor}
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
          {p.compare_at_price && (
            <s className="text-sm text-muted-foreground">
              {money(p.compare_at_price)}
            </s>
          )}
        </div>
        <p className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-warning text-warning" /> {p.rating}
          <span className="text-muted-foreground">
            ({p.review_count} reviews)
          </span>
        </p>
        <p className="text-sm text-muted-foreground">{p.quality_note}</p>
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
            <Select
              value={variantId}
              onValueChange={setVariantId}
              onOpenChange={loadVariants}
            >
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
            onClick={() => variant && onAdd(variant)}
          >
            <ShoppingBag className="h-4 w-4" /> Add to cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
