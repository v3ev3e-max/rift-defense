import { waves } from "../data/waves";
export class WaveSystem {
  number = 0;
  queue: string[] = [];
  spawnTimer = 0;
  elapsed = 0;
  start(n: number) {
    this.number = n;
    this.elapsed = 0;
    this.spawnTimer = 0;
    const w = waves[n - 1];
    this.queue = [...(w.boss ? [w.boss] : []), ...w.enemies];
  }
  get data() {
    return waves[this.number - 1];
  }
}
