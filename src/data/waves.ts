export interface Wave {
  number: number;
  enemies: string[];
  interval: number;
  reward: number;
  boss?: string;
  elite: boolean;
}
export const waves: Wave[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const pool = [
    "crawler",
    ...(n > 2 ? ["runner"] : []),
    ...(n > 4 ? ["brute"] : []),
    ...(n > 6 ? ["armored"] : []),
    ...(n > 11 ? ["jammer"] : []),
    ...(n > 17 ? ["elite"] : []),
  ];
  const count = 9 + Math.floor(n * 0.85);
  const list = Array.from(
    { length: count },
    (_, j) => pool[(j * 7 + n) % pool.length],
  );
  if (n === 20) list.unshift("elite", "elite", "elite");
  return {
    number: n,
    enemies: list,
    interval: Math.min(0.9, 15 / count),
    reward: 18 + n * 2,
    boss: n === 10 ? "ravager" : n === 30 ? "sovereign" : undefined,
    elite: n === 5 || n === 15 || n === 20 || n === 25,
  };
});
