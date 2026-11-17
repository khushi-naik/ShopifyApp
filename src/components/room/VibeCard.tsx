import { ArrowRightLeft, Check, Home, Plus, TreePine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VibeRead } from "@/lib/room-types";

export function VibeCard({ vibe, photo }: { vibe: VibeRead; photo: string }) {
  return (
    <Card className="animate-rise overflow-hidden rounded-3xl shadow-soft">
      <div className="grid sm:grid-cols-[2fr_3fr]">
        <img src={photo} alt="Your room" className="aspect-[4/3] h-full w-full object-cover" />
        <div>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl">Vibe read</CardTitle>
              {vibe.demo && <Badge variant="warn">Demo analysis</Badge>}
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary" className="gap-1 capitalize">
                {vibe.indoor_outdoor === "indoor" ? <Home className="h-3 w-3" /> : <TreePine className="h-3 w-3" />}
                {vibe.room_type} · {vibe.indoor_outdoor}
              </Badge>
              <Badge variant="secondary" className="capitalize">{vibe.space_state}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Style</p>
              <p className="text-lg font-semibold">
                {vibe.primary_style} <span className="font-normal text-muted-foreground">with {vibe.secondary_style} notes</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Palette · {vibe.palette_name}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {vibe.palette.map((c) => (
                  <div key={c.hex + c.name} className="flex items-center gap-2">
                    {/* Swatch colors come from the photo, so they are data, not theme tokens. */}
                    <span className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                    <span className="text-sm">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </div>
      </div>
      <CardContent className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        {vibe.space_state === "empty" ? (
          <div className="sm:col-span-2">
            <p className="mb-2 font-semibold">What's missing</p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {vibe.gaps.map((g) => (
                <li key={g.area} className="flex gap-2 rounded-xl bg-muted p-3 text-sm">
                  <Plus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span><b className="font-medium">{g.area}:</b> {g.suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 font-semibold">Keep</p>
              <ul className="space-y-2">
                {vibe.keep.map((k) => (
                  <li key={k.item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: k.color_hex }} />
                    {k.item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Swap</p>
              <ul className="space-y-2">
                {vibe.swaps.map((s) => (
                  <li key={s.current} className="flex gap-2 text-sm">
                    <ArrowRightLeft className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{s.current} → {s.suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
