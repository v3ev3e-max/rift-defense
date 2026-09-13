export function assetUrl(path: string): string {
  const local = (window as unknown as {
    __RIFT_LOCAL_ASSETS__?: Record<string, string>;
  }).__RIFT_LOCAL_ASSETS__?.[path];
  if (local) return local;
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
