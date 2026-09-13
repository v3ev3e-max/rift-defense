import {enemies as enemyDefs} from './enemies';
export interface Wave {
  number: number;
  enemies: string[];
  interval: number;
  reward: number;
  boss?: string;
  objective?: string;
  objectiveName?: string;
  elite: boolean;
  phase: string;
}

const bossCycle = ["ravager", "sovereign", "tempest", "abyssal"] as const;

/**
 * Endless wave generator tuned for nonstop random-defense play.
 *  - every 5th wave: elite pressure wave
 *  - every 10th wave: rotating boss wave
 *  - new enemy archetypes enter by phase, so high waves are not HP-only scaling
 */
export function getWave(n: number): Wave {
  n = Math.max(1, Math.floor(n));

  const phase =
    n <= 10 ? "BREACH" :
    n <= 20 ? "PURSUIT" :
    n <= 30 ? "ARMORED" :
    n <= 40 ? "OVERDRIVE" :
    n <= 50 ? "DISTORTION" :
    "ENDLESS";

  const pool = [
    "crawler",
    ...(n >= 3 ? ["runner"] : []),
    ...(n >= 6 ? ["brute"] : []),
    ...(n >= 11 ? ["jammer"] : []),
    ...(n >= 16 ? ["armored"] : []),
    ...(n >= 21 ? ["bulwark"] : []),
    ...(n >= 31 ? ["sprinter"] : []),
    ...(n >= 41 ? ["phantom"] : []),
    ...(n >= 51 ? ["elite"] : []),
  ];

  const count = Math.min(84, 9 + Math.floor(n * 0.68) + Math.floor(Math.sqrt(n) * 2));
  const list = Array.from({ length: count }, (_, j) => pool[(j + n * 3) % pool.length]);

  const elite = n % 5 === 0 && n % 10 !== 0;
  if (elite) {
    const extras = Math.min(10, 2 + Math.floor(n / 15));
    list.unshift(...Array.from({ length: extras }, () => "elite"));
    if (n >= 25) list.unshift("bulwark");
    if (n >= 35) list.unshift("sprinter", "sprinter");
  }

  // Every 25th non-boss checkpoint becomes a speed-pressure wave.
  if (n % 25 === 0 && n % 10 !== 0) {
    list.unshift(...Array.from({ length: 8 }, () => "sprinter"));
  }

  const boss = n % 10 === 0 ? bossCycle[(Math.floor(n / 10) - 1) % bossCycle.length] : undefined;

  return {
    number: n,
    enemies: list,
    interval: Math.max(0.18, Math.min(0.86, 13 / Math.max(1, list.length))),
    reward: 18 + Math.floor(n * 2.35),
    boss,
    elite,
    phase,
  };
}

// Opening progression snapshot for tests/tools that still import `waves`.
export const waves: Wave[] = Array.from({ length: 50 }, (_, i) => getWave(i + 1));

export function waveBrief(n:number){
 const w=getWave(n), counts={고속:0,장갑:0,원거리:0,군집:0,교란:0};
 for(const id of w.enemies){const e=enemyDefs[id],special=e.armor>=12||!!e.ranged||!!e.disrupt;if(e.armor>=12)counts.장갑++;if(e.ranged)counts.원거리++;if(e.disrupt)counts.교란++;if(e.speed>=140)counts.고속++;else if(!special)counts.군집++;}
 return "다음 "+n+"웨이브 · "+Object.entries(counts).filter(([,v])=>v).map(([k,v])=>k+" "+Math.round(v/w.enemies.length*100)+"%").join(" · ")+(w.boss?" · 보스":"")+" / 대응: "+(counts.고속?"감속·저지 ":"")+(counts.장갑?"저격·마법 ":"")+(counts.원거리?"전방 탱커 ":"")+(counts.교란?"정화·분산 ":"")+(counts.군집?"관통·광역":"");
}
