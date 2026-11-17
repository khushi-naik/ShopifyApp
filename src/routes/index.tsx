import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { BriefForm } from "@/components/room/BriefForm";
import { CartSheet } from "@/components/room/CartSheet";
import { Landing } from "@/components/room/Landing";
import { ProductCard } from "@/components/room/ProductCard";
import { VibeCard } from "@/components/room/VibeCard";
import { Button } from "@/components/ui/button";
import { analyzeRoom, findMatches } from "@/lib/room.functions";
import { prepareImage } from "@/lib/image-utils";
import type {
  Brief,
  CartLine,
  Mode,
  RankedMatch,
  Variant,
  VibeRead,
} from "@/lib/room-types";

const INITIAL_BRIEF: Brief = {
  goal: "decide",
  category: "seating",
  budget: 500,
  spaceWidth: null,
  users: [],
  feelings: [],
  inStock: true,
  rated4: true,
  onSale: false,
  setting: "indoor",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Room Match — Decor that feels right at home" },
      {
        name: "description",
        content: "Find decor that fits your room, your style and your budget.",
      },
    ],
  }),
  component: Index,
});

type Stage = "start" | "brief" | "matches";

function Index() {
  const [stage, setStage] = useState<Stage>("start");
  const [mode, setMode] = useState<Mode>("empty");
  const [photo, setPhoto] = useState<string | null>(null);
  const [vibe, setVibe] = useState<VibeRead | null>(null);
  const [brief, setBrief] = useState<Brief>(INITIAL_BRIEF);
  const [matches, setMatches] = useState<RankedMatch[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImage = async (source: string | File, selectedMode: Mode) => {
    setLoading(true);
    setError(null);
    setMatches([]);
    setMode(selectedMode);
    try {
      const prepared = await prepareImage(source);
      const read = await analyzeRoom({
        data: {
          image: prepared.dataUrl,
          mode: selectedMode,
          colors: prepared.colors,
        },
      });
      setPhoto(prepared.dataUrl);
      setVibe(read);
      setStage("brief");
    } catch (reason) {
      console.error("Could not analyze the room photo:", reason);
      setError(
        reason instanceof TypeError && /fetch/i.test(reason.message)
          ? "We couldn't reach the room analysis service. Check the app connection and try again."
          : reason instanceof Error
            ? reason.message
            : "We couldn't read that photo. Try a JPG or PNG image instead.",
      );
    } finally {
      setLoading(false);
    }
  };

  const showMatches = async () => {
    if (!vibe) return;
    setLoading(true);
    setError(null);
    try {
      setMatches(await findMatches({ data: { brief, vibe } }));
      setStage("matches");
    } catch (reason) {
      console.error("Could not find room matches:", reason);
      setError(
        reason instanceof Error
          ? `We couldn't load live Shopify product matches. ${reason.message}`
          : "We couldn't load live Shopify product matches. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: RankedMatch["product"], variant: Variant) => {
    setCart((current) => {
      const existing = current.find(
        (line) =>
          line.product.id === product.id && line.variant.id === variant.id,
      );
      if (existing) {
        return current.map((line) =>
          line === existing ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [...current, { product, variant, qty: 1 }];
    });
    toast.success("Added to your cart");
  };

  const updateQuantity = (
    productId: string,
    variantId: string,
    qty: number,
  ) => {
    setCart((current) =>
      qty < 1
        ? current.filter(
            (line) =>
              line.product.id !== productId || line.variant.id !== variantId,
          )
        : current.map((line) =>
            line.product.id === productId && line.variant.id === variantId
              ? { ...line, qty }
              : line,
          ),
    );
  };

  const reset = () => {
    setStage("start");
    setMode("empty");
    setPhoto(null);
    setVibe(null);
    setBrief(INITIAL_BRIEF);
    setMatches([]);
    setError(null);
  };

  const cartCount = cart.reduce((total, line) => total + line.qty, 0);

  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <button
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={reset}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>Room Match</span>
        </button>
        <Button
          variant="outline"
          className="relative rounded-full"
          aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Cart</span>
          <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {cartCount}
          </span>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 pb-14 pt-5 sm:px-6 sm:pt-10">
        {stage !== "start" && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setStage(stage === "matches" ? "brief" : "start")}
            >
              <ArrowLeft className="h-4 w-4" />
              {stage === "matches"
                ? "Back to preferences"
                : "Change room photo"}
            </Button>
            <ol
              className="flex items-center gap-2 text-sm text-muted-foreground"
              aria-label="Progress"
            >
              <li
                className={
                  stage === "brief" ? "font-semibold text-foreground" : ""
                }
              >
                Your room
              </li>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              <li
                className={
                  stage === "brief" ? "font-semibold text-foreground" : ""
                }
              >
                Your brief
              </li>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              <li
                className={
                  stage === "matches" ? "font-semibold text-foreground" : ""
                }
              >
                Your matches
              </li>
            </ol>
          </div>
        )}

        {stage === "start" && !loading && (
          <Landing mode={mode} onMode={setMode} onImage={handleImage} />
        )}

        {loading && (
          <div
            className="mx-auto flex min-h-72 max-w-xl flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-soft"
            role="status"
            aria-live="polite"
          >
            <span className="rounded-full bg-accent p-4 text-accent-foreground">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-semibold">
                {stage === "start"
                  ? "Reading the feel of your room…"
                  : "Finding your best matches…"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {stage === "start"
                  ? "Looking at the colors, style and what the space might need."
                  : "Comparing style, room fit, price, reviews and current deals."}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex items-start justify-between gap-4 rounded-2xl border border-destructive/30 bg-card p-4 text-sm"
            role="alert"
          >
            <p>{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {stage === "brief" && vibe && photo && !loading && (
          <div className="space-y-6">
            <VibeCard vibe={vibe} photo={photo} />
            <BriefForm
              brief={brief}
              onChange={setBrief}
              onSubmit={showMatches}
              loading={loading}
            />
          </div>
        )}

        {stage === "matches" && vibe && photo && !loading && (
          <div className="space-y-8">
            <VibeCard vibe={vibe} photo={photo} />
            <section aria-labelledby="matches-title" className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-primary">
                    Curated for your room
                  </p>
                  <h1
                    id="matches-title"
                    className="mt-1 text-3xl font-semibold tracking-tight"
                  >
                    Your best-fit finds
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Live Shopify listings ranked by room fit, style, value,
                    quality details and available shopper feedback.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setStage("brief")}
                >
                  Edit preferences
                </Button>
              </div>

              {matches.length ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => (
                    <ProductCard
                      key={match.product.id}
                      match={match}
                      budget={brief.budget}
                      spaceWidth={brief.spaceWidth}
                      onAdd={(variant) => addToCart(match.product, variant)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center">
                  <h2 className="text-xl font-semibold">
                    No pieces match every must-have yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
                    Try increasing your budget or relaxing a filter to see more
                    options. We’ll keep your room and style preferences.
                  </p>
                  <Button
                    className="mt-5 rounded-full"
                    onClick={() => setStage("brief")}
                  >
                    <ArrowLeft className="h-4 w-4" /> Adjust preferences
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}

        <footer className="rounded-2xl border border-border bg-card/80 px-5 py-4 text-center text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            Thoughtful picks for your space. No pressure to buy.
          </span>
        </footer>
      </main>

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        lines={cart}
        onQuantityChange={updateQuantity}
        onRemove={(productId, variantId) =>
          updateQuantity(productId, variantId, 0)
        }
        vibe={vibe}
        brief={brief}
      />
    </div>
  );
}
