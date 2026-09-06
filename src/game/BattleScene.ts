import Phaser from "phaser";
import { heroes, heroById } from "../data/heroes";
import { enemies } from "../data/enemies";
import { MAP, path, slots } from "../data/map";
import type { BattleModel } from "../systems/BattleModel";
export class BattleScene extends Phaser.Scene {
  model: BattleModel;
  ground!: Phaser.GameObjects.Graphics;
  ink!: Phaser.GameObjects.Graphics;
  heroSprites: Phaser.GameObjects.Image[] = [];
  enemySprites: Phaser.GameObjects.Image[] = [];
  labels: Phaser.GameObjects.Text[] = [];
  callback: () => void;
  dragUid = 0;
  constructor(model: BattleModel, callback: () => void) {
    super("Battle");
    this.model = model;
    this.callback = callback;
  }
  preload() {
    for (const h of heroes) {
      const url = h.asset.url ?? `/assets/heroes/${h.id}.png`;
      if (h.asset.atlas) this.load.atlas(h.asset.key, url, h.asset.atlas);
      else this.load.image(h.asset.key, url);
    }
  }
  create() {
    this.cameras.main.setBackgroundColor("#172331");
    this.ground = this.add.graphics();
    this.drawMap();
    this.ink = this.add.graphics();
    for (const def of Object.values(enemies)) {
      const g = this.make.graphics({ x: 0, y: 0 });
      const color = def.color;
      g.fillStyle(0x0a101e);
      g.fillRect(3, 4, 26, 27);
      g.fillStyle(color);
      g.fillRect(6, 8, 20, 16);
      g.fillRect(9, 4, 14, 22);
      g.fillRect(3, 22, 8, 7);
      g.fillRect(21, 22, 8, 7);
      g.fillStyle(0x23283e);
      g.fillRect(9, 12, 5, 4);
      g.fillRect(19, 12, 5, 4);
      g.fillStyle(0xffffff);
      g.fillRect(10, 12, 3, 2);
      g.fillRect(20, 12, 3, 2);
      if (def.armor) {
        g.fillStyle(0x566780);
        g.fillRect(6, 5, 20, 5);
      }
      g.generateTexture(`enemy-${def.id}`, 32, 32);
      g.destroy();
    }
    this.enemySprites = this.model.enemies.map(() =>
      this.add.image(-50, -50, "enemy-crawler").setVisible(false),
    );
    for (let i = 0; i < 22; i++) {
      const sp = this.add
        .image(0, 0, "sera")
        .setScale(1.07)
        .setVisible(false)
        .setInteractive(
          new Phaser.Geom.Rectangle(-40, -26, 128, 116),
          Phaser.Geom.Rectangle.Contains,
        );
      this.input.setDraggable(sp);
      sp.on("pointerdown", () => {
        const u = this.model.units[i];
        if (u) {
          this.model.selected = u.uid;
          this.model.revision++;
          this.callback();
        }
      });
      this.heroSprites.push(sp);
      this.labels.push(
        this.add
          .text(0, 0, "", {
            fontFamily: "monospace",
            fontSize: "13px",
            color: "#ffe299",
            stroke: "#101727",
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setVisible(false),
      );
    }
    this.input.on(
      "dragstart",
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
        const idx = this.heroSprites.indexOf(obj);
        this.dragUid = this.model.units[idx]?.uid ?? 0;
      },
    );
    this.input.on(
      "drag",
      (
        _p: Phaser.Input.Pointer,
        obj: Phaser.GameObjects.Image,
        x: number,
        y: number,
      ) => {
        obj.setPosition(x, y);
      },
    );
    this.input.on("dragend", (pointer: Phaser.Input.Pointer) => {
      if (this.dragUid) {
        let best = -1,
          dist = 90;
        slots.forEach((p, i) => {
          const d = Phaser.Math.Distance.Between(
            pointer.worldX,
            pointer.worldY,
            p.x,
            p.y,
          );
          if (d < dist) {
            dist = d;
            best = i;
          }
        });
        if (best >= 0) this.model.move(this.dragUid, best);
      }
      this.dragUid = 0;
      this.callback();
    });
    this.input.on(
      "pointerdown",
      (p: Phaser.Input.Pointer, objects: unknown[]) => {
        if (objects.length) return;
        let chosen = -1;
        slots.forEach((s, i) => {
          if (Math.hypot(s.x - p.worldX, s.y - p.worldY) < 68) chosen = i;
        });
        if (chosen >= 0) {
          const occupant = this.model.units.find((u) => u.slot === chosen);
          if (occupant) this.model.selected = occupant.uid;
          else if (this.model.selectedUnit) {
            this.model.move(this.model.selected, chosen);
          } else this.model.selectedSlot = chosen;
          this.model.revision++;
          this.callback();
        }
      },
    );
    this.events.once("shutdown", () => {
      this.input.removeAllListeners();
      this.heroSprites = [];
      this.enemySprites = [];
      this.labels = [];
    });
  }
  drawMap() {
    const g = this.ground;
    g.fillStyle(0x192736);
    g.fillRect(0, 0, MAP.width, MAP.height);
    g.lineStyle(1, 0x29404d, 0.4);
    for (let x = 0; x < 1000; x += 40) g.lineBetween(x, 0, x, 580);
    for (let y = 0; y < 580; y += 40) g.lineBetween(0, y, 1000, y);
    // Fixed city lanes: wide concrete, inset asphalt, dashed flow direction.
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i];
      g.lineStyle(72, 0x101b29);
      g.lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(62, 0x354653);
      g.lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(52, 0x283642);
      g.lineBetween(a.x, a.y, b.x, b.y);
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      for (let t = 22; t < len; t += 46) {
        const f = t / len,
          f2 = Math.min(1, (t + 16) / len);
        g.lineStyle(2, 0x7b8890, 0.32);
        g.lineBetween(
          a.x + (b.x - a.x) * f,
          a.y + (b.y - a.y) * f,
          a.x + (b.x - a.x) * f2,
          a.y + (b.y - a.y) * f2,
        );
      }
    }
    for (const [i, s] of slots.entries()) {
      g.fillStyle(0x101e2b);
      g.fillRoundedRect(s.x - 36, s.y - 32, 72, 62, 5);
      g.lineStyle(1, 0x4a676d, 0.65);
      g.strokeRoundedRect(s.x - 36, s.y - 32, 72, 62, 5);
      g.lineStyle(2, 0x7acbb2, 0.4);
      g.lineBetween(s.x - 8, s.y, s.x + 8, s.y);
      g.lineBetween(s.x, s.y - 8, s.x, s.y + 8);
      this.add.text(s.x - 29, s.y - 26, String(i + 1).padStart(2, "0"), {
        fontSize: "10px",
        fontFamily: "monospace",
        color: "#607c82",
      });
    }
    // Utility buildings and original floor markings.
    for (const [x, y, w, h] of [
      [25, 200, 70, 55],
      [910, 230, 65, 110],
      [30, 390, 62, 160],
      [920, 22, 57, 55],
    ]) {
      g.fillStyle(0x101a27);
      g.fillRect(x + 5, y + 8, w, h);
      g.fillStyle(0x334858);
      g.fillRect(x, y, w, h);
      g.lineStyle(3, 0x536573);
      g.strokeRect(x + 4, y + 4, w - 8, h - 8);
      for (let k = 8; k < w - 8; k += 14) {
        g.fillStyle(0x83ccb8, 0.5);
        g.fillRect(x + k, y + 12, 5, 10);
      }
    }
    g.fillStyle(0xb895eb, 0.2);
    g.fillEllipse(35, 126, 70, 80);
    g.lineStyle(4, 0xb498ed);
    g.strokeEllipse(32, 126, 42, 60);
    g.lineStyle(2, 0xe0c7ff);
    g.strokeEllipse(32, 126, 22, 48);
    g.fillStyle(0x91f4d1, 0.14);
    g.fillCircle(957, 477, 47);
    g.lineStyle(3, 0x9bedcf);
    g.strokeCircle(957, 477, 30);
    g.fillStyle(0xb9ffe2);
    g.fillPoints(
      [
        { x: 957, y: 452 },
        { x: 974, y: 477 },
        { x: 957, y: 502 },
        { x: 940, y: 477 },
      ],
      true,
    );
    this.add.text(15, 69, "RIFT / ENTRY", {
      fontSize: "12px",
      color: "#b8a5e4",
      fontFamily: "monospace",
    });
    this.add.text(900, 527, "CORE / 01", {
      fontSize: "12px",
      color: "#92e6cd",
      fontFamily: "monospace",
    });
  }
  update(_time: number, delta: number) {
    this.model.update(delta / 1000);
    const m = this.model,
      g = this.ink;
    g.clear();
    const selected = m.selectedUnit;
    if (selected && selected.slot >= 0) {
      g.fillStyle(0x86edcf, 0.05);
      g.fillCircle(selected.x, selected.y, m.stats(selected).range);
      g.lineStyle(1, 0x86edcf, 0.3);
      g.strokeCircle(selected.x, selected.y, m.stats(selected).range);
      g.lineStyle(2, 0x9df8d5);
      g.strokeRoundedRect(selected.x - 36, selected.y - 32, 72, 62, 5);
    }
    if (m.selectedSlot >= 0) {
      const s = slots[m.selectedSlot];
      g.lineStyle(3, 0x99ffd7);
      g.strokeRect(s.x - 36, s.y - 32, 72, 62);
    }
    for (let i = 0; i < this.heroSprites.length; i++) {
      const u = m.units[i],
        sp = this.heroSprites[i],
        label = this.labels[i];
      if (!u || u.slot < 0) {
        sp.setVisible(false);
        label.setVisible(false);
        continue;
      }
      sp.setVisible(true)
        .setTexture(
          heroById[u.heroId].asset.key,
          heroById[u.heroId].asset.frame,
        )
        .setAlpha(u.hp <= 0 ? 0.25 : 1)
        .setDepth(20 + u.y);
      if (u.uid !== this.dragUid) sp.setPosition(u.x, u.y - 10);
      label
        .setVisible(true)
        .setPosition(u.x, u.y + 25)
        .setText("★".repeat(u.star))
        .setDepth(650);
      g.fillStyle(0x101727);
      g.fillRect(u.x - 20, u.y - 42, 40, 3);
      g.fillStyle(u.hp > u.maxHp * 0.5 ? 0x98e9cd : 0xffac8a);
      g.fillRect(u.x - 20, u.y - 42, (40 * u.hp) / u.maxHp, 3);
      if (heroById[u.heroId].build === "drone" || m.builds.drone) {
        const a = m.time * 1.8 + i;
        const dx = u.x + Math.cos(a) * 30,
          dy = u.y - 20 + Math.sin(a) * 12;
        g.fillStyle(0xe8d493);
        g.fillRect(dx - 5, dy - 3, 10, 6);
        g.fillStyle(0x90decf);
        g.fillRect(dx - 9, dy - 1, 18, 2);
      }
    }
    for (const e of m.enemies) {
      const sp = this.enemySprites[e.index];
      if (!e.active) {
        sp.setVisible(false);
        continue;
      }
      const boss = !!enemies[e.kind].boss;
      sp.setVisible(true)
        .setTexture(`enemy-${e.kind}`)
        .setPosition(e.x, e.y)
        .setScale(boss ? 1.9 : 1.03)
        .setDepth(20 + e.y);
      const width = boss ? 56 : 26;
      g.fillStyle(0x101727);
      g.fillRect(e.x - width / 2, e.y - (boss ? 36 : 22), width, 4);
      g.fillStyle(boss ? 0xf5a178 : 0xc6a9ec);
      g.fillRect(
        e.x - width / 2,
        e.y - (boss ? 36 : 22),
        (width * e.hp) / e.maxHp,
        4,
      );
      if (e.burn) {
        g.fillStyle(0xff9a66);
        g.fillRect(e.x - 12, e.y + 15, 5, 5);
      }
      if (e.bleed) {
        g.fillStyle(0xf56c97);
        g.fillRect(e.x - 4, e.y + 15, 5, 5);
      }
      if (e.slowTime) {
        g.fillStyle(0x8edbff);
        g.fillRect(e.x + 4, e.y + 15, 5, 5);
      }
    }
    const max = m.save.settings.lowEffects ? 25 : m.effects.length;
    for (let i = 0; i < max; i++) {
      const f = m.effects[i];
      if (f.life <= 0) continue;
      if (f.type === "shot") {
        g.lineStyle(2, f.color, Math.min(1, f.life * 9));
        g.lineBetween(f.x, f.y - 8, f.tx, f.ty);
        g.fillStyle(f.color, f.life * 6);
        g.fillCircle(f.tx, f.ty, 3);
      } else {
        g.lineStyle(2, f.color, f.life * 2);
        g.strokeCircle(f.tx, f.ty, (0.45 - f.life) * 130);
      }
    }
    g.setDepth(700);
    this.callback();
  }
}
