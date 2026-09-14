import Phaser from "phaser";
import { BattleScene } from "./BattleScene";
import type { BattleModel } from "../systems/BattleModel";
import { recommendedTargetFps } from "../utils/performance";
export function createGame(model: BattleModel, callback: () => void, onLoadProgress:(progress:number,file:string)=>void=()=>{}, onReady:()=>void=()=>{}) {
  // The battlefield uses painted backgrounds and detailed anime sprites. Use
  // smooth sampling when the fixed 800x800 backing canvas is fitted to the UI.
  return new Phaser.Game({
    // Android browsers can discard a WebGL context while the battle scene is
    // decoding its large sprite set, leaving the HTML HUD alive over a blank
    // battlefield. The 800px scene is small enough for Canvas 2D and Canvas is
    // considerably more predictable across mobile Chrome/WebView devices.
    type: Phaser.CANVAS,
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
    scene: [new BattleScene(model, callback, onLoadProgress, onReady)],
    banner: false,
  });
}
