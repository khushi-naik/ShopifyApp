/** Resize a photo for upload and pull its dominant colors (used by the demo fallback). */
export async function prepareImage(
  src: string | File,
): Promise<{ dataUrl: string; colors: string[] }> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  const img = new Image();
  try {
    img.crossOrigin = "anonymous";
    img.src = url;
    try {
      await img.decode();
    } catch (error) {
      const message =
        typeof src === "string"
          ? "We couldn't load the sample room photo. Check that the app is running and try again."
          : "We couldn't read this photo. Try a JPG or PNG image.";
      throw new Error(message, { cause: error });
    }

    const max = 1024;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error(
        "Your browser couldn't prepare this photo. Try another image.",
      );
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

    const s = document.createElement("canvas");
    s.width = s.height = 32;
    const sctx = s.getContext("2d");
    if (!sctx)
      throw new Error("Your browser couldn't read this photo's colors.");
    sctx.drawImage(img, 0, 0, 32, 32);
    const px: ArrayLike<number> = sctx.getImageData(0, 0, 32, 32).data;
    const buckets = new Map<
      string,
      { n: number; r: number; g: number; b: number }
    >();
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] ?? 0,
        g = px[i + 1] ?? 0,
        b = px[i + 2] ?? 0;
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
      const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      bk.n++;
      bk.r += r;
      bk.g += g;
      bk.b += b;
      buckets.set(key, bk);
    }
    const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
    const colors = [...buckets.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, 4)
      .map((b) => `#${hex(b.r / b.n)}${hex(b.g / b.n)}${hex(b.b / b.n)}`);
    return { dataUrl, colors };
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}

export const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 ? 2 : 0,
  });
