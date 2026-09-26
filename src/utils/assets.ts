export function assetUrl(path: string): string {
  const localAssets = (window as unknown as {
    __RIFT_LOCAL_ASSETS__?: Record<string, string>;
  }).__RIFT_LOCAL_ASSETS__;
  const local = localAssets?.[path];
  if (local) return local;
  // The direct-open build deliberately omits a few optional, high-resolution
  // generated PNGs to keep the single HTML file usable on mobile. Never fall
  // through to import.meta in that IIFE build: one optional missing frame used
  // to abort Phaser's whole preload cycle and leave the battlefield at 0%.
  if (localAssets) {
    console.warn(`[offline asset fallback] ${path}`);
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'/%3E";
  }
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${import.meta.env.BASE_URL ?? "/"}${path.replace(/^\//, "")}`;
}
