export type PerformanceProfile = "desktop" | "mobile" | "low";

function nav(): Navigator | undefined {
  return typeof navigator === "undefined" ? undefined : navigator;
}

export function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth <= 820;
  const ua = nav()?.userAgent ?? "";
  return narrow || coarse || /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

export function performanceProfile(): PerformanceProfile {
  const n = nav() as (Navigator & { deviceMemory?: number }) | undefined;
  const cores = n?.hardwareConcurrency ?? 8;
  const memory = n?.deviceMemory ?? 8;
  if (memory <= 4 || cores <= 4) return "low";
  if (isMobileDevice()) return "mobile";
  return "desktop";
}

export function recommendedEnemyCap() {
  const profile = performanceProfile();
  if (profile === "low") return isMobileDevice() ? 28 : 36;
  if (profile === "mobile") return 34;
  return 48;
}

export function recommendedTargetFps() {
  return isMobileDevice() ? 60 : 120;
}

export function baseEffectCap(manualLowEffects: boolean) {
  if (manualLowEffects) return 18;
  const profile = performanceProfile();
  if (profile === "low") return 20;
  if (profile === "mobile") return 30;
  return 64;
}
