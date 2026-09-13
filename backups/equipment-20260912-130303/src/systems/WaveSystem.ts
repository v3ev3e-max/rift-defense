import { getWave, type Wave } from "../data/waves";
export class WaveSystem {
  provider = getWave;
  number = 0;
  queue: string[] = [];
  spawnTimer = 0;
  elapsed = 0;
  private current?: Wave;
  start(n: number) {
    this.number = Math.max(1, Math.floor(n));
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.current = this.provider(this.number);
    this.queue = [...(this.current.boss ? [this.current.boss] : []), ...this.current.enemies];
  }
  get data() {
    return this.current ?? this.provider(Math.max(1, this.number));
  }
}
