export class GameAudio {
  context?: AudioContext;
  enabled = true;
  lastAttack = 0;
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
    } catch {
      /* Silent environments remain playable. */
    }
  }
  play(kind: string) {
    if (!this.enabled || !this.context || this.context.state !== "running")
      return;
    const now = this.context.currentTime;
    if (kind === "attack" && now - this.lastAttack < 0.12) return;
    this.lastAttack = kind === "attack" ? now : this.lastAttack;
    const melodies: Record<string, number[]> = {
      attack: [150],
      summon: [440, 660],
      merge: [440, 554, 880],
      level: [523, 659, 784],
      boss: [110, 98, 73],
      victory: [523, 659, 784, 1046],
      defeat: [220, 196, 147],
    };
    try {
      for (const [i, hz] of (melodies[kind] ?? [440]).entries()) {
        const osc = this.context.createOscillator(),
          gain = this.context.createGain();
        osc.type = kind === "attack" ? "triangle" : "sine";
        osc.frequency.value = hz;
        const t = now + i * 0.09;
        gain.gain.setValueAtTime(kind === "attack" ? 0.015 : 0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start(t);
        osc.stop(t + 0.17);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }
    } catch {
      /* Web Audio is optional. */
    }
  }
}
