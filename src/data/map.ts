import type { Point } from "./types";
export const MAP = { width: 1000, height: 580 };
export const path: Point[] = [
  { x: 0, y: 126 },
  { x: 865, y: 126 },
  { x: 865, y: 300 },
  { x: 140, y: 300 },
  { x: 140, y: 477 },
  { x: 1000, y: 477 },
];
export interface Slot extends Point {
  type: "any" | "melee" | "ranged";
}
export const slots: Slot[] = [
  ...[260, 420, 580, 740].map((x) => ({ x, y: 208, type: "any" as const })),
  ...[260, 420, 580, 740].map((x) => ({ x, y: 385, type: "any" as const })),
  ...[260, 420, 580, 740].map((x) => ({ x, y: 52, type: "any" as const })),
  ...[260, 420, 580, 740].map((x) => ({ x, y: 544, type: "any" as const })),
];
export const segments = path
  .slice(1)
  .map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
export const pathLength = segments.reduce((a, b) => a + b, 0);
export function pathPoint(distance: number, out: Point): Point {
  for (let i = 0; i < segments.length; i++) {
    if (distance <= segments[i]) {
      const t = distance / segments[i];
      out.x = path[i].x + (path[i + 1].x - path[i].x) * t;
      out.y = path[i].y + (path[i + 1].y - path[i].y) * t;
      return out;
    }
    distance -= segments[i];
  }
  Object.assign(out, path[path.length - 1]);
  return out;
}
