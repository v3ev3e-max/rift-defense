import Phaser from "phaser";
import { BattleScene } from "./BattleScene";
import type { BattleModel } from "../systems/BattleModel";
import { recommendedTargetFps } from "../utils/performance";
export function createGame(model: BattleModel, callback: () => void) {
  // The battlefield uses painted backgrounds and detailed anime sprites. Use
  // smooth sampling when the fixed 800x800 backing canvas is fitted to the UI.
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-container",
    width: 800,
    height: 800,
    backgroundColor: "#172331",
    pixelArt: false,
    roundPixels: false,
    antialias: true,
    antialiasGL: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: recommendedTargetFps(), forceSetTimeOut: false, smoothStep: false },
    audio: { noAudio: true },
    scene: [new BattleScene(model, callback)],
    banner: false,
  });
}
