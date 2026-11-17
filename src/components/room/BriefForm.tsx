import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATEGORIES, type Brief, type Goal } from "@/lib/room-types";
import { money } from "@/lib/image-utils";

export function BriefForm({
  brief,
  onChange,
  onSubmit,
  loading,
}: {
  brief: Brief;
  onChange: (b: Brief) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => onChange({ ...brief, [k]: v });
  return (
    <Card className="animate-rise rounded-3xl">
      <CardHeader>
        <CardTitle className="text-2xl">Three quick questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base">1. What are you after?</Label>
          <ToggleGroup
            type="single"
            value={brief.goal}
            onValueChange={(v) => v && set("goal", v as Goal)}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            <ToggleGroupItem value="specific" variant="outline" className="h-auto py-3 data-[state=on]:border-primary data-[state=on]:bg-accent">A specific piece</ToggleGroupItem>
            <ToggleGroupItem value="whole" variant="outline" className="h-auto py-3 data-[state=on]:border-primary data-[state=on]:bg-accent">A whole room</ToggleGroupItem>
            <ToggleGroupItem value="decide" variant="outline" className="h-auto py-3 data-[state=on]:border-primary data-[state=on]:bg-accent">Help me decide what's missing</ToggleGroupItem>
          </ToggleGroup>
          {brief.goal === "specific" && (
            <Select value={brief.category} onValueChange={(v) => set("category", v as Brief["category"])}>
              <SelectTrigger className="capitalize sm:w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label className="text-base">2. Budget per piece</Label>
            <span className="text-lg font-semibold">up to {money(brief.budget)}</span>
          </div>
          <Slider min={50} max={1500} step={25} value={[brief.budget]} onValueChange={([v]) => set("budget", v ?? brief.budget)} />
        </div>

        <div className="space-y-3">
          <Label className="text-base">3. Must-haves</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["inStock", "In stock"],
                ["rated4", "Rated 4★ or higher"],
                ["onSale", "On sale"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span>{label}</span>
                <Switch checked={brief[k]} onCheckedChange={(v) => set(k, v)} />
              </label>
            ))}
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span>Shopping for outdoors</span>
              <Switch checked={brief.setting === "outdoor"} onCheckedChange={(v) => set("setting", v ? "outdoor" : "indoor")} />
            </label>
          </div>
        </div>

        <Button size="lg" className="w-full rounded-full text-base" onClick={onSubmit} disabled={loading}>
          <Search className="h-4 w-4" /> {loading ? "Finding your matches…" : "Show my matches"}
        </Button>
      </CardContent>
    </Card>
  );
}
