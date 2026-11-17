import { useRef, useState } from "react";
import { ImageUp, Sofa, Sparkles, SquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mode } from "@/lib/room-types";

const SAMPLES = [
  { src: "/samples/empty-room.jpg", label: "Empty living room", mode: "empty" as Mode },
  { src: "/samples/furnished-room.jpg", label: "Furnished living room", mode: "refresh" as Mode },
];

export function Landing({
  mode,
  onMode,
  onImage,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  onImage: (src: string | File, mode: Mode) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const take = (f?: File | null) => {
    if (f && f.type.startsWith("image/")) onImage(f, mode);
  };

  return (
    <section className="animate-rise space-y-10">
      <div className="space-y-4 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
          <Sparkles className="h-4 w-4" /> Room Match
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Buy pieces you know will feel right in your room.
        </h1>
        <p className="mx-auto max-w-lg text-lg text-muted-foreground">
          Share a photo. We read its style and colors, then find what fits your space and your budget.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="What are you doing?">
        {(
          [
            { m: "empty", title: "Fill an empty space", body: "A bare corner, wall or new room", Icon: SquareDashed },
            { m: "refresh", title: "Refresh a room I have", body: "Keep what works, swap what doesn't", Icon: Sofa },
          ] as const
        ).map(({ m, title, body, Icon }) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            onClick={() => onMode(m)}
            className={cn(
              "flex items-start gap-4 rounded-2xl border-2 bg-card p-5 text-left transition",
              mode === m ? "border-primary shadow-soft" : "border-border hover:border-primary/50",
            )}
          >
            <span className={cn("rounded-xl p-2.5", mode === m ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="text-sm text-muted-foreground">{body}</span>
            </span>
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files[0]);
        }}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload a room photo"
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed bg-card px-6 py-12 text-center transition",
          drag ? "border-primary bg-accent" : "border-border hover:border-primary/60",
        )}
      >
        <span className="rounded-full bg-accent p-4 text-accent-foreground">
          <ImageUp className="h-7 w-7" />
        </span>
        <p className="text-lg font-semibold">Drop a room photo here</p>
        <p className="text-sm text-muted-foreground">or click to browse · JPG, PNG or HEIC</p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => take(e.target.files?.[0])}
        />
      </div>

      <div className="space-y-3">
        <p className="text-center text-sm font-medium text-muted-foreground">No photo handy? Try one of ours</p>
        <div className="grid grid-cols-2 gap-3">
          {SAMPLES.map((s) => (
            <button
              key={s.src}
              onClick={() => {
                onMode(s.mode);
                onImage(s.src, s.mode);
              }}
              className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:shadow-soft"
            >
              <img src={s.src} alt={s.label} width={1024} height={768} className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" />
              <span className="block px-3 py-2 text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
