import Phaser from "phaser";
import { BattleScene } from "./BattleScene";
import type { BattleModel } from "../systems/BattleModel";
export function createGame(model: BattleModel, callback: () => void) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-container",
    width: 1000,
    height: 580,
    backgroundColor: "#172331",
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 120, forceSetTimeOut: false, smoothStep: false },
    audio: { noAudio: true },
    scene: [new BattleScene(model, callback)],
    banner: false,
  });
}
