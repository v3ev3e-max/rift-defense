export function assetUrl(path: string): string {
  return (
    (window as unknown as { __RIFT_LOCAL_ASSETS__?: Record<string, string> })
      .__RIFT_LOCAL_ASSETS__?.[path] ?? path
  );
}
