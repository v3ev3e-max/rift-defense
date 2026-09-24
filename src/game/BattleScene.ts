import {generatedVfxNames} from './GeneratedVfx';
import Phaser from "phaser";
import { assetUrl } from '../utils/assets';
import { heroes, heroById } from "../data/heroes";
import { enemies } from "../data/enemies";
import { HERO_RENDER, poseSize, defeatPoseSize, weaponPoint, dronePoint, fitProjectile } from "./WeaponSockets";

import { MAP, CELL } from "../data/map";
import {battleTimeScale,type BattleModel} from "../systems/BattleModel";
import { baseEffectCap } from "../utils/performance";
import { reactionColors,reactionNames } from "../systems/ElementSystem";
import { ATTACK_SECONDS, visualFrame, heroVisuals, fitVisual } from './VisualRules';
import { enemyMotion, enemyMoveFrameCount } from './EnemyMotion';
import {campaignEnemyIds,campaignLaneAsset,campaignRegion} from '../data/campaign';
import {formationRole} from '../data/combatRoles';
import {heroAuras} from './SkillVisuals';
const regionalEnemyArt:Record<number,Set<string>>={
  1:new Set(['crawler']),
  2:new Set(['crawler','runner']),
  3:new Set(['crawler','runner','sprinter']),
  4:new Set(['armored','brute','crawler','ravager','sprinter']),
  5:new Set(['armored','crawler','jammer']),
  6:new Set(['armored','brute','jammer','runner']),
  7:new Set(['bulwark','jammer','phantom','sprinter']),
  8:new Set(['abyssal','armored','bulwark','elite','jammer','phantom']),
  9:new Set(['sky_guard','sky_lancer','cloud_gunner','aether_mender','named_sky','storm_wyvern','sky_dominion']),
  10:new Set(['relic_golem','dune_ripper','sun_archer','mirage_oracle','named_dune','sand_colossus','solar_sphinx']),
  11:new Set(['alloy_guard','gear_hound','pulse_turret','repair_weaver','named_machine','forge_overseer','machine_god']),
  12:new Set(['paradox_shell','chrono_stalker','epoch_caster','time_mender','named_time','chrono_reaper','aeon_sovereign']),
};
export class BattleScene extends Phaser.Scene {
  model: BattleModel;
  ground!: Phaser.GameObjects.Graphics;
  selectedPad!: Phaser.GameObjects.Image;
  rangeLabel!: Phaser.GameObjects.Text;
  campaignWarnings: Phaser.GameObjects.Image[]=[];
  ink!: Phaser.GameObjects.Graphics;
  heroSprites: Phaser.GameObjects.Image[] = [];
  heroHealthFrames: Phaser.GameObjects.Image[] = [];
  heroSkillDurationGauges: Phaser.GameObjects.Image[] = [];
  heroVisualHp: number[] = [];
  heroLastHp: number[] = [];
  heroHealthHitUntil: number[] = [];
  enemySprites: Phaser.GameObjects.Image[] = [];
  enemyShadowSprites: Phaser.GameObjects.Ellipse[] = [];
  enemyStepSprites: Phaser.GameObjects.Image[] = [];
  enemyVisualHp: number[] = [];
  enemyVisualGeneration: number[] = [];
  enemyHitUntil: number[] = [];
  enemyNextHitFlash: number[] = [];
  enemyStatusSprites: Phaser.GameObjects.Image[] = [];
  enemyMarkSprites: Phaser.GameObjects.Image[] = [];
  aimSprites: Phaser.GameObjects.Image[] = [];
  zoneSprites: Phaser.GameObjects.Image[] = [];
  actionSprites: Phaser.GameObjects.Image[] = [];
  droneSprites: Phaser.GameObjects.Image[] = [];
  labels: Phaser.GameObjects.Text[] = [];
  skillCalloutLabels: Phaser.GameObjects.Text[] = [];
  defeatCooldownLabels: Phaser.GameObjects.Text[] = [];
  reactionLabels: Phaser.GameObjects.Text[] = [];
  damageLabels: Phaser.GameObjects.Text[] = [];
  fxSprites: Phaser.GameObjects.Image[] = [];
  activeHeroIds = new Set<string>();
  heroShotCounts: number[] = [];
  heroDroneShotCounts: number[] = [];
  heroAttackStarted: number[] = [];
  heroVisualUids: number[] = [];
  visualTime = 0;
  hudElapsed = 0;
  lastHudRevision = -1;
  callback: () => void;
  onLoadProgress: (progress:number,file:string) => void;
  onReady: () => void;
  dragUid = 0;
  lastUnitTapUid = 0;
  lastUnitTapAt = 0;
  lastTouchUid = 0;
  lastTouchAt = 0;
  adaptiveEffectCap = 64;
  campaignArea = 0;
  regionalEnemyVisuals = new Set<string>();
  enemyMoveFrames:Record<string,number>={};
  initialEnemyKey='enemy-crawler';
  perfElapsed = 0;
  perfFrames = 0;
  perfRecovery = 0;
  textureReady(key:string){
    if(!this.textures.exists(key))return false;
    const texture=this.textures.get(key);
    return texture.key!=='__MISSING'&&!!texture.source?.[0]?.image;
  }
  constructor(model: BattleModel, callback: () => void, onLoadProgress: (progress:number,file:string) => void=()=>{}, onReady:()=>void=()=>{}) {
    super("Battle");
    this.model = model;
    this.callback = callback;
    this.onLoadProgress=onLoadProgress;
    this.onReady=onReady;
  }
  preload() {
    this.load.on('progress',(value:number)=>this.onLoadProgress(value,''));
    this.load.on('fileprogress',(file:Phaser.Loader.File)=>this.onLoadProgress(this.load.progress,file.key));
    for(const name of generatedVfxNames)this.load.image(`vfx-${name}`,assetUrl(`/assets/generated/vfx/${name}.webp`));
    this.load.image('map-rift-courtyard', assetUrl(this.model.campaign?`/assets/campaign/${this.model.campaign.background}`:'/assets/maps/teal-laboratory.png'));
    for(const name of ['pad','selected','entry','core'])this.load.image(`lab-${name}`,assetUrl(`/assets/lab/${name}.png`));
    if(this.model.campaign)for(const name of ['pad','ring'])this.load.image(`campaign-${name}`,assetUrl(`/assets/campaign/${name}.png`));
    this.load.image('campaign-warning',assetUrl('/assets/campaign/warning.png'));
    this.load.image('hero-health-frame',assetUrl('/assets/ui/generated/hero-health-frame.webp'));
    this.load.image('skill-duration-gauge',assetUrl('/assets/ui/generated/skill-duration-gauge-v2.png'));
    this.load.image('reaction-generated',assetUrl('/assets/effects/common/reaction_generated.png'));
    const campaignArea=this.model.campaign?campaignRegion(this.model.campaign):0;
    const visualArea=campaignArea>12?campaignArea-4:campaignArea;
    this.campaignArea=campaignArea;
    if(campaignArea)this.load.image('campaign-lane',assetUrl(campaignLaneAsset(campaignArea)));
    const campaignIds=this.model.campaign?campaignEnemyIds(this.model.campaign):new Set<string>();
    const activeEnemyDefs=Object.values(enemies).filter(def=>
      !this.model.campaign||campaignIds.has(def.id)
    );
    this.initialEnemyKey=`enemy-${activeEnemyDefs[0]?.id??'crawler'}`;
    for (const def of activeEnemyDefs){
      const visualId=def.visualId??def.id;
      const regional=campaignArea>0&&campaignIds.has(def.id)&&regionalEnemyArt[visualArea]?.has(visualId);
      if(regional)this.regionalEnemyVisuals.add(def.id);
      const folder=`/assets/generated/campaign-enemies/map-${String(visualArea).padStart(2,'0')}`;
      this.load.image(`enemy-${def.id}`, assetUrl(regional&&visualId!=="elite"?`${folder}/${visualId}.webp`:`/assets/generated/enemies/${visualId}.webp`));
      const moveCount=enemyMoveFrameCount(!!def.boss,!!regional);
      this.enemyMoveFrames[def.id]=moveCount;
      for(let frame=1;frame<=moveCount;frame++)this.load.image(`enemy-${def.id}-move-${frame}`,assetUrl(regional&&visualId!=="elite"?`${folder}/${visualId}/move/move_${String(frame).padStart(2,'0')}.webp`:`/assets/generated/enemy-motion/${visualId}/move_${String(frame).padStart(2,'0')}.webp`));
      if(regional)for(let frame=1;frame<=3;frame++)this.load.image(`enemy-${def.id}-death-${frame}`,assetUrl(visualId!=="elite"?`${folder}/${visualId}/death/frame_${String(frame).padStart(2,'0')}.webp`:`/assets/generated/enemies/${visualId}.webp`));
      if(def.ranged&&regional)for(let frame=1;frame<=3;frame++)this.load.image(`enemy-${def.id}-fire-${frame}`,assetUrl(`${folder}/${def.id}/fire/frame_${String(frame).padStart(2,'0')}.webp`));
    }
    for(const element of ['water','fire','electric','dark'])for(let frame=1;frame<=4;frame++)
      this.load.image(`transfer-${element}-${frame}`,assetUrl(`/assets/generated/element-transfers/${element}_${String(frame).padStart(2,'0')}.webp`));
    for(let frame=1;frame<=4;frame++)
      this.load.image(`slash-anim-${frame}`,assetUrl(`/assets/generated/slash-animation/slash_${String(frame).padStart(2,'0')}.webp`));
    for (let frame=1;frame<=4;frame++)
      this.load.image(`enemy-step-${frame}`,assetUrl(campaignArea?`/assets/generated/campaign-enemies/map-${String(visualArea).padStart(2,'0')}/fx/step/frame_${String(frame).padStart(2,'0')}.webp`:`/assets/generated/enemy-steps/step_${String(frame).padStart(2,'0')}.webp`));
    for (const grade of ['B','A','S','SR'])
      this.load.image(`summon-${grade}`, assetUrl(`/assets/ui/summon_${grade}.png`));
    this.load.image('summon-slot', assetUrl('/assets/ui/summon_slot.png'));
    this.load.image('meteor-source',assetUrl('/assets/generated/meteor-source.webp'));
    for(const kind of ['circle','meteor','impact'])for(let frame=1;frame<=4;frame++)this.load.image(`luna-meteor-${kind}-${frame}`,assetUrl(`/assets/generated/luna-meteor/${kind}_${String(frame).padStart(2,'0')}.webp`));
    this.load.image('drone-body', assetUrl('/assets/generated/drone/body.webp'));
    this.load.image('sniper-round-v2',assetUrl('/assets/generated/sniper-round-v2.webp'));
    for(let frame=1;frame<=3;frame++)this.load.image(`sniper-muzzle-${frame}`,assetUrl(`/assets/generated/sniper-muzzle/frame_${String(frame).padStart(2,'0')}.webp`));
    for(const id of ['yuria','mia','leon','neris','livia','hana','gaia','astra','rhea','echo','meriel','selene','ophilia'])for(let frame=1;frame<=4;frame++)
      this.load.image(`support-skill-${id}-${frame}`,assetUrl(`/assets/generated/support-skills/${id}/frame_${String(frame).padStart(2,'0')}.webp`));
    for (const name of ['projectile','impact','overcharge'])
      this.load.image(`drone-${name}`, assetUrl(`/assets/generated/drone/${name}.webp`));
    for (const name of ['rage','frost','storm','void','disrupt'])
      this.load.image(`enemy-fx-${name}`, assetUrl(`/assets/generated/enemy-effects/${name}.webp`));
    for(let frame=1;frame<=3;frame++){
      this.load.image(`enemy-rift-bolt-${frame}`,assetUrl(campaignArea?`/assets/generated/campaign-enemies/map-${String(campaignArea).padStart(2,'0')}/fx/projectile/frame_${String(frame).padStart(2,'0')}.webp`:`/assets/generated/enemy-projectiles/rift_bolt_${String(frame).padStart(2,'0')}.webp`));
      this.load.image(`enemy-ranged-impact-${frame}`,assetUrl(campaignArea?`/assets/generated/campaign-enemies/map-${String(campaignArea).padStart(2,'0')}/fx/impact/frame_${String(frame).padStart(2,'0')}.webp`:`/assets/generated/enemy-ranged-impact/frame_${String(frame).padStart(2,'0')}.webp`));
    }
    for (const name of ['burn','bleed','slow','armor-break'])
      this.load.image(`status-${name}`, assetUrl(`/assets/generated/status/${name}.webp`));
    for (const element of ['fire','water','electric','dark']) {
      this.load.image(`common-${element}-impact`, assetUrl(`/assets/effects/common/${element}_impact.png`));
      this.load.image(`common-${element}-projectile`, assetUrl(`/assets/effects/common/${element}_projectile.png`));
      this.load.image(`common-${element}-mark`, assetUrl(`/assets/effects/common/${element}_mark.png`));
    }
    const activeIds = heroes.map(h=>h.id);
    this.activeHeroIds = new Set(activeIds);

    // Small static fallbacks are cheap enough to keep for every hero, while
    // animation/effect textures are loaded only for the active deck.
    for (const h of heroes) {
      const url = assetUrl(h.asset.url ?? `/assets/heroes/${h.id}.png`);
      if (h.asset.atlas) this.load.atlas(h.asset.key, url, h.asset.atlas);
      else this.load.image(h.asset.key, url);
    }
    for (const id of activeIds) {
      this.load.image(`hero-${id}-idle-front`,assetUrl(`/assets/heroes/${id}/frame_01.png`));
      for(let frame=1;frame<=3;frame++)this.load.image(`hero-${id}-defeat-${frame}`,assetUrl(`/assets/generated/hero-defeat/${id}/frame_${String(frame).padStart(2,'0')}.webp`));
      for(let frame=1;frame<=6;frame++)this.load.image(`hero-${id}-up-${frame}`,assetUrl(`/assets/combat/${id}/up6_${String(frame).padStart(2,"0")}.png`));
      for(let frame=1;frame<=6;frame++)this.load.image(`hero-${id}-skill-${frame}`,assetUrl(`/assets/combat/${id}/skill_${String(frame).padStart(2,"0")}.png`));
      for (let frame = 1; frame <= 8; frame++) {
        this.load.image(
          `hero-${id}-anim-${frame}`,
          assetUrl(`/assets/combat/${id}/frame_${String(frame).padStart(2, "0")}.png`),
        );
      }

      this.load.image(`fx-${id}-projectile-1`, assetUrl(`/assets/effects/${id}/projectile_01.png`));
      this.load.image(`fx-${id}-projectile-2`, assetUrl(`/assets/effects/${id}/projectile_02.png`));
      this.load.image(`fx-${id}-projectile-3`, assetUrl(`/assets/effects/${id}/projectile_03.png`));

      {
        this.load.image(`fx-${id}-impact-1`, assetUrl(`/assets/effects/${id}/impact_01.png`));
        this.load.image(`fx-${id}-impact-2`, assetUrl(`/assets/effects/${id}/impact_02.png`));
        this.load.image(`fx-${id}-impact-3`, assetUrl(`/assets/effects/${id}/impact_03.png`));
        this.load.image(`fx-${id}-skill`, assetUrl(`/assets/effects/${id}/skill.png`));
      }
      if (id === "yuria")
        this.load.image("fx-yuria-barrier", assetUrl("/assets/effects/yuria/barrier.png"));
    }
  }
  create() {
    // Touch screens report a few pixels of finger jitter even for a tap. Require
    // a deliberate move or short hold before Phaser starts a drag so double-tap
    // merge remains reliable on iPhone and Android.
    this.input.dragDistanceThreshold=12;
    this.input.dragTimeThreshold=140;
    const syncBounds=()=>this.scale.updateBounds();
    const touchMerge=(event:TouchEvent)=>{
      const touch=event.changedTouches[0];if(!touch||this.model.paused||this.model.ended||this.model.choices.length)return;
      const rect=this.game.canvas.getBoundingClientRect(),x=(touch.clientX-rect.left)/rect.width*MAP.width,y=(touch.clientY-rect.top)/rect.height*MAP.height;
      const unit=this.model.units.filter(u=>u.slot>=0).sort((a,b)=>Math.hypot(a.x-x,a.y+HERO_RENDER.offsetY-y)-Math.hypot(b.x-x,b.y+HERO_RENDER.offsetY-y))[0];
      if(!unit||Math.hypot(unit.x-x,unit.y+HERO_RENDER.offsetY-y)>54)return;
      const now=performance.now();
      if(this.lastTouchUid===unit.uid&&now-this.lastTouchAt<=360){this.model.merge(unit.uid);this.lastTouchUid=0;this.lastTouchAt=0;this.callback();}
      else{this.lastTouchUid=unit.uid;this.lastTouchAt=now;}
    };
    window.addEventListener('scroll',syncBounds,true);
    this.game.canvas.addEventListener('pointerdown',syncBounds,true);
    this.game.canvas.addEventListener('touchstart',syncBounds,true);
    this.game.canvas.addEventListener('touchend',touchMerge,true);
    this.events.once('shutdown',()=>{
      window.removeEventListener('scroll',syncBounds,true);
      this.game.canvas.removeEventListener('pointerdown',syncBounds,true);
      this.game.canvas.removeEventListener('touchstart',syncBounds,true);
      this.game.canvas.removeEventListener('touchend',touchMerge,true);
    });
    // The generated source uses neutral checker pixels; key those out once at load.
    // Keep saturated cyan/violet pixels, including the dim outer flame.
    if(!this.textures.exists('meteor-alpha')){
      const source=this.textures.get('meteor-source').getSourceImage() as HTMLImageElement;
      const texture=this.textures.createCanvas('meteor-alpha',256,358)!;
      const ctx=texture.context;ctx.drawImage(source,0,0,256,358);
      const pixels=ctx.getImageData(0,0,256,358),d=pixels.data;
      for(let i=0;i<d.length;i+=4){const chroma=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);d[i+3]=Math.round(d[i+3]*Math.min(1,Math.max(0,(chroma-30)/35)));}
      ctx.putImageData(pixels,0,0);texture.refresh();
    }
    this.cameras.main.setBackgroundColor("#172331");
    this.adaptiveEffectCap = baseEffectCap(this.model.save.settings.lowEffects);
    this.ground = this.add.graphics();
    this.drawMap();
    this.ink = this.add.graphics();
    this.input.dragDistanceThreshold=8;
    this.reactionLabels=Array.from({length:8},()=>this.add.text(0,0,'',{fontSize:'16px',fontFamily:'sans-serif',fontStyle:'bold',color:'#bffbff',stroke:'#15232f',strokeThickness:3}).setOrigin(.5).setDepth(751).setVisible(false));
    this.aimSprites=this.model.actions.map(()=>this.add.image(0,0,'vfx-reticle').setVisible(false).setDepth(643));
    this.zoneSprites=this.model.zones.map(()=>this.add.image(0,0,'vfx-zone').setVisible(false).setDepth(3));
    this.actionSprites=this.model.actions.map(()=>this.add.image(0,0,'drone-body').setVisible(false).setDepth(645));
    this.damageLabels=this.model.damageNumbers.map(()=>this.add.text(0,0,'',{fontSize:'20px',fontFamily:'sans-serif',fontStyle:'bold',color:'#fff3b0',stroke:'#15232f',strokeThickness:3}).setOrigin(.5).setDepth(750).setVisible(false));
    this.enemySprites = this.model.enemies.map(() =>
      this.add.image(-50, -50, this.initialEnemyKey).setOrigin(.5,.72).setVisible(false),
    );
    this.enemyShadowSprites=this.model.enemies.map(()=>this.add.ellipse(-50,-50,42,13,0x07131c,.55).setVisible(false));
    this.enemyStepSprites=this.model.enemies.map(()=>this.add.image(-50,-50,'enemy-step-1').setVisible(false).setBlendMode(Phaser.BlendModes.ADD));
    this.enemyVisualHp=this.model.enemies.map(()=>0);
    this.enemyVisualGeneration=this.model.enemies.map(()=>-1);
    this.enemyHitUntil=this.model.enemies.map(()=>0);
    this.enemyNextHitFlash=this.model.enemies.map(()=>0);
    this.enemyStatusSprites = Array.from({length:this.model.enemies.length*4},() =>
      this.add.image(-50, -50, "status-burn").setVisible(false).setDepth(640),
    );
    this.enemyMarkSprites = this.model.enemies.map(() =>
      this.add.image(-50, -50, "common-fire-mark").setVisible(false).setDepth(641),
    );
    for (let i = 0; i < 22; i++) {
      const sp = this.add
        .image(0, 0, "sera")
        .setDisplaySize(HERO_RENDER.size,HERO_RENDER.size)
        .setOrigin(HERO_RENDER.originX/HERO_RENDER.sourceSize,HERO_RENDER.originY/HERO_RENDER.sourceSize)
        .setVisible(false)
        .setInteractive(
          new Phaser.Geom.Rectangle(15, 12, 130, 140),
          Phaser.Geom.Rectangle.Contains,
        );
      this.input.setDraggable(sp);
      sp.on("pointerdown", () => {
        const u = this.model.units[i];
        if (u && !this.model.paused && !this.model.ended && !this.model.choices.length) {
          this.model.selected = u.uid;
          this.model.revision++;
          this.callback();
        }
      });
      sp.on('pointerup',(pointer:Phaser.Input.Pointer)=>{
        const u=this.model.units[i];if(!u||pointer.getDistance()>8||this.dragUid||this.model.paused)return;
        const now=performance.now();
        if(this.lastUnitTapUid===u.uid&&now-this.lastUnitTapAt<=320){this.model.merge(u.uid);this.lastUnitTapUid=0;this.lastUnitTapAt=0;this.callback();}
        else{this.lastUnitTapUid=u.uid;this.lastUnitTapAt=now;}
      });
      this.heroSprites.push(sp);
      this.heroHealthFrames.push(this.add.image(-50,-50,'hero-health-frame').setVisible(false).setDepth(654));
      this.heroSkillDurationGauges.push(this.add.image(-50,-50,'skill-duration-gauge').setOrigin(0,.5).setVisible(false).setDepth(656).setBlendMode(Phaser.BlendModes.ADD));
      this.droneSprites.push(
        this.add.image(-50,-50,'drone-body').setVisible(false).setDepth(630),
      );
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
      this.skillCalloutLabels.push(this.add.text(0,0,'',{
        fontFamily:'sans-serif',fontSize:'17px',fontStyle:'bold',color:'#ffffff',
        backgroundColor:'#10233ddd',padding:{x:9,y:4},stroke:'#09131f',strokeThickness:4,align:'center',
      }).setOrigin(.5,1).setDepth(755).setVisible(false));
      this.defeatCooldownLabels.push(this.add.text(0,0,'',{fontFamily:'monospace',fontSize:'23px',fontStyle:'bold',color:'#ffcfdf',stroke:'#351526',strokeThickness:5,align:'center'}).setOrigin(.5).setDepth(690).setVisible(false));
      this.heroShotCounts[i] = 0;
      this.heroDroneShotCounts[i] = 0;
      this.heroAttackStarted[i] = -999;
      this.heroVisualHp[i] = 0;
      this.heroLastHp[i] = 0;
      this.heroHealthHitUntil[i] = 0;
    }
    this.input.on(
      "dragstart",
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
        const idx = this.heroSprites.indexOf(obj);
        this.dragUid = this.model.units[idx]?.uid ?? 0;this.lastUnitTapUid=0;this.lastUnitTapAt=0;
        if(this.model.campaign&&!this.model.started){
          this.model.selected=0;this.model.revision++;this.callback();
          document.querySelector('#campaign-prep')?.classList.add('unit-drop-active');
        }
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
        const event=pointer.event as PointerEvent|undefined,panel=document.querySelector<HTMLElement>('#campaign-prep'),panelRect=panel?.getBoundingClientRect();
        const droppedOnPanel=!!event&&!!panelRect&&event.clientX>=panelRect.left&&event.clientX<=panelRect.right&&event.clientY>=panelRect.top&&event.clientY<=panelRect.bottom;
        if(droppedOnPanel&&this.model.campaign&&!this.model.started){
          const uid=this.dragUid;this.model.reserveCampaignUnit(uid);window.dispatchEvent(new CustomEvent('campaign-unit-reserved',{detail:{uid}}));
          this.dragUid=0;panel?.classList.remove('unit-drop-active');this.callback();return;
        }
        let best = -1,
          dist = CELL * .7;
        this.model.map.slots.forEach((p, i) => {
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
        const hit=this.heroSprites.filter((sp,i)=>sp.visible&&this.model.units[i]?.uid!==this.dragUid&&sp.getBounds().contains(pointer.worldX,pointer.worldY)).sort((a,b)=>b.depth-a.depth)[0];
        if(hit)best=this.model.units[this.heroSprites.indexOf(hit)]?.slot??best;
        const source=this.model.units.find(u=>u.uid===this.dragUid),dest=this.model.units.find(u=>u.slot===best);
        if(source&&dest&&source!==dest&&source.heroId===dest.heroId&&source.star===dest.star)this.model.merge(dest.uid,source.uid);
        else if(best>=0)this.model.move(this.dragUid,best);
      }
      this.dragUid = 0;
      document.querySelector('#campaign-prep')?.classList.remove('unit-drop-active');
      this.callback();
    });
    this.input.on(
      "pointerdown",
      (p: Phaser.Input.Pointer, objects: unknown[]) => {
        if (objects.length || this.model.paused || this.model.choices.length || this.model.ended) return;
        let chosen = -1;
        this.model.map.slots.forEach((s, i) => {
          if (Math.abs(s.x - p.worldX) <= CELL/2 && Math.abs(s.y - p.worldY) <= CELL/2) chosen = i;
        });
        if (chosen >= 0) {
          const occupant = this.model.units.find((u) => u.slot === chosen);
          if (occupant) {
            this.model.selected = occupant.uid;
          } else if (this.model.selectedUnit) {
            if(this.model.placeSelected(chosen)){this.model.selected = 0;this.model.mergePreview=false;}
          } else {
            this.model.summonAt(chosen);
            this.model.selected = 0;
          }
          this.model.revision++;
          this.callback();
        }
      },
    );
    const fxPoolSize = Math.max(12, this.adaptiveEffectCap);
    for (let i = 0; i < fxPoolSize; i++) {
      this.fxSprites.push(
        this.add
          .image(-999, -999, "fx-yuria-impact")
          .setVisible(false)
          .setDepth(680)
          .setBlendMode(Phaser.BlendModes.ADD),
      );
    }
    this.onReady();
    this.events.once("shutdown", () => {
      this.input.removeAllListeners();
      this.heroSprites = [];
      this.heroHealthFrames = [];
      this.heroSkillDurationGauges = [];
      this.heroVisualHp = [];
      this.heroLastHp = [];
      this.heroHealthHitUntil = [];
      this.enemySprites = [];
      this.enemyShadowSprites = [];
      this.enemyStepSprites = [];
      this.enemyVisualHp = [];
      this.enemyVisualGeneration = [];
      this.enemyHitUntil = [];
      this.enemyNextHitFlash = [];
      this.enemyStatusSprites = [];
      this.enemyMarkSprites = [];
      this.droneSprites = [];
      this.labels = [];
      this.skillCalloutLabels = [];
      this.defeatCooldownLabels = [];
      this.fxSprites = [];
      this.heroShotCounts = [];
      this.heroDroneShotCounts = [];
      this.heroAttackStarted = [];
    });
  }
  drawMap() {
    const g = this.ground;
    const {path,slots,obstacles,tint} = this.model.map;
    if (this.textures.exists('map-rift-courtyard')) {
      this.add.image(0, 0, 'map-rift-courtyard').setOrigin(0)
        .setDisplaySize(MAP.width, MAP.height).setTint(tint).setAlpha(1).setDepth(-10);
    } else {
      g.fillStyle(0x192736);
      g.fillRect(0, 0, MAP.width, MAP.height);
    }
    const routeThemes=[
      {edge:0x36513d,border:0xb5a982,lane:0x796f58,mark:0xe7dfbd},
      {edge:0x315d70,border:0xd7d5c8,lane:0x91aeba,mark:0xe8ffff},
      {edge:0x594934,border:0xc3a77b,lane:0x806b50,mark:0xf1d7a2},
      {edge:0x5c7890,border:0xdcecf2,lane:0xa9c4cf,mark:0xf5ffff},
      {edge:0x143c4e,border:0x74a3ad,lane:0x365d6a,mark:0xa8f4e4},
      {edge:0x213d58,border:0x9ec7d5,lane:0x526f84,mark:0xd9fbff},
      {edge:0x292b4c,border:0x7f76a8,lane:0x494664,mark:0xd0c2ff},
      {edge:0x401d36,border:0x9e536f,lane:0x60344d,mark:0xffb2ca},
      {edge:0xd7e9df,border:0xf4d68a,lane:0xeaf4ef,mark:0x59dfff},
      {edge:0x55321f,border:0xd89a4d,lane:0x8e6848,mark:0xffdd7b},
      {edge:0x172c31,border:0x54a9a7,lane:0x33484a,mark:0x76fff2},
      {edge:0x241738,border:0x8a65ba,lane:0x49385e,mark:0xe19cff},
    ];
    const routeTheme=routeThemes[Math.max(0,this.campaignArea-1)]??routeThemes[4];
    if(this.campaignArea&&this.textureReady('campaign-lane')){
      for(const route of [this.model.map,this.model.campaign?.alternate].filter(Boolean)){
        const routePath=route!.path;
        for(let i=1;i<routePath.length;i++){
          const a=routePath[i-1],b=routePath[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
          this.add.tileSprite((a.x+b.x)/2,(a.y+b.y)/2,length+12,76,'campaign-lane')
            .setRotation(Math.atan2(dy,dx)).setDepth(-1).setAlpha(this.campaignArea>=9?.9:.96);
        }
      }
    }
    // The path remains a gameplay overlay, but its material follows each region.
    for(const route of [this.model.map,this.model.campaign?.alternate].filter(Boolean))for (let i = 1; i < route!.path.length; i++) {
      const path=route!.path;
      const a = path[i - 1],
        b = path[i];
      const integrated=!!this.campaignArea,alpha=integrated?.34:1;
      g.lineStyle(integrated?68:76, routeTheme.edge,alpha*.7);
      g.lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(integrated?62:68, routeTheme.border,alpha*.82);
      g.lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(integrated?54:58, routeTheme.lane,alpha);
      g.lineBetween(a.x, a.y, b.x, b.y);
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      for (let t = 22; t < len; t += 46) {
        const f = t / len,
          f2 = Math.min(1, (t + 16) / len);
        g.lineStyle(2, routeTheme.mark, this.campaignArea&&this.campaignArea<=4?.18:.32);
        g.lineBetween(
          a.x + (b.x - a.x) * f,
          a.y + (b.y - a.y) * f,
          a.x + (b.x - a.x) * f2,
          a.y + (b.y - a.y) * f2,
        );
      }
    }
    for (const [i,s] of slots.entries()){
      this.add.image(s.x,s.y,this.model.campaign?'campaign-pad':'lab-pad').setDisplaySize(this.model.campaign?108:84,this.model.campaign?108:84).setDepth(1);
      if(this.model.campaign&&(this.model.campaign.alternate?[1,3,4]:[4]).includes(i))this.add.text(s.x,s.y+35,this.model.campaign.alternate?(i===1?'FRONT A':i===3?'FRONT B':'FRONT C'):'FRONT',{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#ffd68a',stroke:'#10202d',strokeThickness:3}).setOrigin(.5).setDepth(3);
      if(this.model.campaign&&i===5)this.add.text(s.x,s.y+35,'A',{fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',color:'#b5a8ff',stroke:'#10202d',strokeThickness:3}).setOrigin(.5).setDepth(3);
    }
    this.selectedPad=this.add.image(0,0,this.model.campaign?'campaign-ring':'lab-selected').setDisplaySize(112,112).setDepth(2).setVisible(false);
    this.rangeLabel=this.add.text(0,0,'',{fontFamily:'sans-serif',fontSize:'13px',fontStyle:'bold',color:'#f5ffff',backgroundColor:'#071923dd',padding:{x:7,y:4},stroke:'#07131d',strokeThickness:2}).setOrigin(.5,1).setDepth(704).setVisible(false);
    this.campaignWarnings=Array.from({length:this.model.enemies.length},()=>this.add.image(0,0,'campaign-warning').setDisplaySize(190,190).setDepth(680).setVisible(false));
    for(const o of obstacles){
      g.fillStyle(0x101925);g.fillRoundedRect(o.x-23,o.y-23,46,46,4);
      g.lineStyle(2,0xb59a6d,.8);g.strokeRoundedRect(o.x-20,o.y-20,40,40,4);
      g.lineBetween(o.x-12,o.y-12,o.x+12,o.y+12);g.lineBetween(o.x+12,o.y-12,o.x-12,o.y+12);
    }
    // Utility structures now belong to the map artwork below the gameplay.
    const entry=path[0], core=path[path.length-1];
    const ey=Math.max(28,entry.y), cy=Math.min(MAP.height-28,core.y);
    const entryArt=(route:typeof this.model.map)=>{const p=route.path[0],next=route.path[1]??p,dx=p.x-next.x,dy=p.y-next.y,len=Math.max(1,Math.hypot(dx,dy));return {x:p.x+dx/len*42,y:p.y+dy/len*42};};
    const entryVisual=entryArt(this.model.map);
    this.add.image(entryVisual.x,entryVisual.y,'lab-entry').setDisplaySize(74,74).setDepth(2);
    if(this.model.campaign?.alternate){const p=entryArt(this.model.campaign.alternate);this.add.image(p.x,p.y,'lab-entry').setDisplaySize(74,74).setDepth(2);}
    this.add.image(core.x,cy,'lab-core').setDisplaySize(82,82).setDepth(2);
    this.add.text(entry.x-96,ey-36,'← ENTRY',{fontSize:'13px',color:'#ffe0db'});
    this.add.text(core.x-32,cy+40,'CORE',{fontSize:'13px',color:'#b2ffeb'});
    for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);for(let d=100;d<len;d+=140){const x=a.x+dx*d/len,y=a.y+dy*d/len;g.lineStyle(3,routeTheme.mark,.75);const ux=dx/len,uy=dy/len;g.lineBetween(x-ux*7-uy*6,y-uy*7+ux*6,x+ux*4,y+uy*4);g.lineBetween(x-ux*7+uy*6,y-uy*7-ux*6,x+ux*4,y+uy*4);}}

  }
  update(_time: number, delta: number) {
    if (!this.model.paused && !this.model.choices.length && !this.model.ended)
      this.visualTime += Math.min(delta / 1000, 0.25)*battleTimeScale(this.model.speed);
    // Adaptive rendering: gameplay simulation stays deterministic, only visual FX are reduced.
    this.perfElapsed += delta;
    this.perfFrames++;
    if (this.perfElapsed >= 1500) {
      const fps = (this.perfFrames * 1000) / this.perfElapsed;
      const base = baseEffectCap(this.model.save.settings.lowEffects);
      if (fps < 42) {
        this.adaptiveEffectCap = Math.min(base, 14);
        this.perfRecovery = 0;
      } else if (fps < 52) {
        this.adaptiveEffectCap = Math.min(base, 24);
        this.perfRecovery = 0;
      } else if (this.adaptiveEffectCap < base) {
        this.perfRecovery += this.perfElapsed;
        if (this.perfRecovery >= 4500) {
          this.adaptiveEffectCap = Math.min(base, this.adaptiveEffectCap + 10);
          this.perfRecovery = 0;
        }
      } else {
        this.adaptiveEffectCap = base;
        this.perfRecovery = 0;
      }
      this.perfElapsed = 0;
      this.perfFrames = 0;
    }
    this.model.update(delta / 1000);
    const m = this.model,
      g = this.ink;
    g.clear();
    // Persistent zones and travelling attacks use the simulation's exact geometry.
    this.zoneSprites.forEach((sp,i)=>{const z=m.zones[i];sp.setVisible(z.active);if(z.active)sp.setPosition(z.x,z.y).setDisplaySize(z.radius*2,z.radius*2).setTint(z.kind==='storm'?0xa477ff:z.kind==='blackflame'?0xe877ae:z.kind==='plasma'?0xb4ffec:z.kind==='abyss'?0x7b6be0:z.kind==='ice'?0x8cd9ff:z.kind==='corrosion'?0xbb83ff:z.kind==='barrier'?0xffeab0:0xffffff).setAlpha(.55+Math.sin(m.time*3)*.08).setRotation(m.time*.08);});
    this.aimSprites.forEach(s=>s.setVisible(false));
    this.actionSprites.forEach(s=>s.setVisible(false));
    for(const [ai,a] of m.actions.entries()){if(!a.active||a.age<a.delay)continue;const p=Math.min(1,(a.age-a.delay)/a.duration),u=m.units.find(u=>u.uid===a.owner)??a.source;if(!u)continue;
      const c=parseInt(heroById[u.heroId].color.slice(1),16);
      if(a.kind==='sniper'&&!a.hit){const r=30+(1-p)*28;this.actionSprites[ai].setTexture('vfx-reticle').setPosition(a.tx,a.ty).setDisplaySize(r*2,r*2).setRotation((1-p)*.5).setAlpha(1).setVisible(true);const dx=a.tx-a.x,dy=a.ty-a.y;g.lineStyle(2,c,.18+.3*p);g.lineBetween(a.x,a.y,a.tx,a.ty);this.aimSprites[ai].setVisible(false);}
      else if(a.kind==='meteor'||a.kind==='shell'){
        const circlePulse=.92+Math.sin(m.time*8+ai)*.08;
        const meteorFrame=Math.min(4,Math.floor(p*4)+1);
        this.aimSprites[ai].setTexture(a.kind==='meteor'?`luna-meteor-circle-${meteorFrame}`:'vfx-reticle').setPosition(a.tx,a.ty).setDisplaySize(a.radius*2*circlePulse,a.radius*2*circlePulse).setRotation(a.kind==='meteor'?0:m.time*.22).setAlpha(.35+p*.65).setVisible(!a.hit);
        if(!a.hit&&a.kind==='meteor'){
          const startX=a.tx+(a.tx<MAP.width/2?190:-190),startY=-105,travel=Phaser.Math.Easing.Cubic.In(p);
          const x=Phaser.Math.Linear(startX,a.tx,travel),y=Phaser.Math.Linear(startY,a.ty,travel);
          // The meteor artwork points from its upper-right tail toward its lower-left rock head.
          // Rotate that head into the travel vector so the flame trails behind the falling rock.
          const angle=Math.atan2(a.ty-startY,a.tx-startX)-Math.PI*3/4;
          g.fillStyle(0x151022,.18+p*.38);g.fillEllipse(a.tx,a.ty+10,24+p*70,10+p*28);
          this.actionSprites[ai].setTexture(`luna-meteor-meteor-${meteorFrame}`).setPosition(x,y).setDisplaySize(92,92).setRotation(angle).setAlpha(Math.min(1,p*5)).setDepth(670).setVisible(true);
        }else if(!a.hit){
          const x=a.x+(a.tx-a.x)*p,y=a.y+(a.ty-a.y)*p-Math.sin(p*Math.PI)*90;
          this.actionSprites[ai].setTexture('vfx-shell').setPosition(x,Math.max(12,y)).setDisplaySize(48,24).setRotation(Math.atan2(a.ty-a.y,a.tx-a.x)).setAlpha(1).setVisible(true);
        }
      }
      else if(a.kind==='drone'){const t=a.hit?Math.min(1,(a.age-a.delay-a.duration)/.55):p,x=a.hit?a.tx+(u.x-a.tx)*t:a.x+(a.tx-a.x)*t,y=a.hit?a.ty+(u.y-20-a.ty)*t:a.y+(a.ty-a.y)*t;this.aimSprites[ai].setTexture('vfx-bullet').setPosition(x-12,y).setDisplaySize(35,12).setRotation(Math.atan2(a.ty-a.y,a.tx-a.x)).setAlpha(.5).setVisible(true);this.actionSprites[ai].setTexture('drone-body').setPosition(x,y).setDisplaySize(34,34).setVisible(true).setRotation(Math.sin(m.time*8+ai)*.08);}
      else if(!a.hit&&a.kind==='burst'){
        // Rapid-fire operators are hitscan: only the target impact is rendered.
      }
      // Other attacks resolve at the target with their dedicated impact/area animation.
      // Generic firearm bullets made weapon sockets look bent; bespoke drones, shells and meteors keep their own motion.
    }
    const selected = m.selectedUnit;
    this.campaignWarnings.forEach((sp,i)=>{const e=m.enemies[i],active=e.active&&!!e.strikeAt;sp.setVisible(active);if(active)sp.setPosition(e.strikeX!,e.strikeY!).setDisplaySize(170+Math.sin(m.time*9)*18,170+Math.sin(m.time*9)*18).setAlpha(.72+Math.sin(m.time*9)*.18);});
    if(m.campaign){
      for(const u of m.units){if(u.slot<0)continue;const left=Math.max(0,(u.moveReadyAt??0)-m.time);if(left){g.lineStyle(5,0x72dacb,.8);g.beginPath();g.arc(u.x,u.y,48,-Math.PI/2,-Math.PI/2+Math.PI*2*(left/10),false);g.strokePath();}}
      if(selected&&selected.hp>0&&m.time>=(selected.moveReadyAt??0))for(const p of m.map.slots){if(!m.units.some(u=>u.slot===m.map.slots.indexOf(p))){g.lineStyle(3,0x9affe2,.8);g.strokeRoundedRect(p.x-44,p.y-44,88,88,10);}}
    }
    this.selectedPad.setVisible(!!selected && selected.slot>=0);
    if(selected)this.selectedPad.setPosition(selected.x,selected.y);
    if (selected && selected.slot >= 0) {
      const range=m.stats(selected).range,role=formationRole(selected.heroId),rangeColor=role==='tank'?0xffcf72:role==='sniper'?0x79d8ff:role==='support'?0xc89bff:0x79f2cd;
      const pulse=.72+Math.sin(this.visualTime*4.2)*.16;
      g.fillStyle(rangeColor, 0.105);
      g.fillCircle(selected.x, selected.y, range);
      g.lineStyle(6, 0x06151e, 0.72);
      g.strokeCircle(selected.x, selected.y, range);
      g.lineStyle(3, rangeColor, pulse);
      g.strokeCircle(selected.x, selected.y, range);
      g.lineStyle(1, 0xf2ffff, .68);
      g.strokeCircle(selected.x, selected.y, Math.max(4,range-4));
      for(let a=0;a<Math.PI*2;a+=Math.PI/4){const c=Math.cos(a),s=Math.sin(a);g.lineStyle(4,rangeColor,.95);g.lineBetween(selected.x+c*(range-8),selected.y+s*(range-8),selected.x+c*(range+8),selected.y+s*(range+8));}
      g.lineStyle(2, 0x9df8d5);
      g.strokeRoundedRect(selected.x - 24, selected.y - 24, 48, 48, 5);
      this.rangeLabel.setText(`사거리 ${(range/CELL).toFixed(1)}칸`).setPosition(selected.x,Math.max(30,selected.y-61)).setVisible(true);
    } else {
      this.rangeLabel.setVisible(false);
    }
    if(!m.campaign&&selected&&(m.mergePreview||this.dragUid)){for(const v of m.units){if(v===selected)continue;const valid=v.heroId===selected.heroId&&v.star===selected.star&&v.star<5;g.lineStyle(3,valid?0xc698ff:0xb96666,.8);g.strokeRoundedRect(v.x-42,v.y-45,84,84,8);}}
    if (m.selectedSlot >= 0) {
      const s = m.map.slots[m.selectedSlot];
      g.lineStyle(3, 0x99ffd7);
      g.strokeRect(s.x - 36, s.y - 32, 72, 62);
    }
    const pointer=this.input.activePointer;
    if(selected && !m.paused && !m.choices.length && !m.ended && pointer.x>=0 && pointer.y>=0 && pointer.x<=MAP.width && pointer.y<=MAP.height){
      const cell=m.map.slots.find(s=>Math.abs(s.x-pointer.worldX)<=CELL/2&&Math.abs(s.y-pointer.worldY)<=CELL/2);
      const x=cell?.x??pointer.worldX,y=cell?.y??pointer.worldY;
      const valid=!!cell&&!m.units.some(u=>u!==selected&&u.slot===m.map.slots.indexOf(cell));
      const color=valid?0x9df8d5:0xff6677;
      g.lineStyle(2,color,.7);g.strokeRect(x-24,y-24,48,48);
      if(valid){const range=m.stats(selected).range;g.fillStyle(color,.06);g.fillCircle(x,y,range);g.lineStyle(5,0x06151e,.62);g.strokeCircle(x,y,range);g.lineStyle(2,color,.82);g.strokeCircle(x,y,range);}
    }
    for (let i = 0; i < this.heroSprites.length; i++) {
      const u = m.units[i],
        sp = this.heroSprites[i],
        healthFrame=this.heroHealthFrames[i],
        skillGauge=this.heroSkillDurationGauges[i],
        label = this.labels[i],
        skillCallout=this.skillCalloutLabels[i],
        defeatCooldown = this.defeatCooldownLabels[i];
      if (!u || u.slot < 0) {
        sp.setVisible(false);
        healthFrame.setVisible(false);
        skillGauge.setVisible(false);
        this.droneSprites[i].setVisible(false);
        label.setVisible(false);
        skillCallout.setVisible(false);
        defeatCooldown.setVisible(false);
        continue;
      }
      defeatCooldown.setVisible(false);
      const animatedHero =
        this.activeHeroIds.has(u.heroId) &&
        this.textures.exists(`hero-${u.heroId}-anim-1`);
      // Real 12FPS attack animation: heroes stay on frame 1 while idle and only
      // run eight frames at 12FPS when a basic/drone shot actually happens.
      // This avoids permanently cycling textures and cuts render work on mobile.
      if (this.heroVisualUids[i] !== u.uid) {
        this.heroVisualUids[i] = u.uid;
        this.heroShotCounts[i] = u.shots;
        this.heroDroneShotCounts[i] = u.droneShots;
        this.heroAttackStarted[i] = -999;
        this.heroVisualHp[i]=u.hp;
        this.heroLastHp[i]=u.hp;
        this.heroHealthHitUntil[i]=0;
      }
      if(u.hp<this.heroLastHp[i])this.heroHealthHitUntil[i]=this.visualTime+.42;
      this.heroLastHp[i]=u.hp;
      this.heroVisualHp[i]=Phaser.Math.Linear(this.heroVisualHp[i]??u.hp,u.hp,.13);
      if(Math.abs(this.heroVisualHp[i]-u.hp)<.15)this.heroVisualHp[i]=u.hp;
      const hpRatio=Phaser.Math.Clamp(u.hp/Math.max(1,u.maxHp),0,1),trailRatio=Phaser.Math.Clamp(this.heroVisualHp[i]/Math.max(1,u.maxHp),0,1),barX=u.x-31,barY=u.y-75;
      if(u.hp>0){
        const low=hpRatio<=.3,pulse=low ? .72+Math.sin(this.visualTime*9)*.28 : 1,fill=hpRatio>.6?0x64f2be:hpRatio>.3?0xffd86b:0xff617a;
        g.fillStyle(0x06131c,.94);g.fillRoundedRect(barX,barY,62,8,3);
        if(trailRatio>hpRatio){g.fillStyle(0xffcf72,.86);g.fillRoundedRect(barX+2,barY+2,58*trailRatio,4,2);}
        g.fillStyle(fill,pulse);g.fillRoundedRect(barX+2,barY+2,58*hpRatio,4,2);
        g.fillStyle(0xeaffff,.36);g.fillRect(barX+3,barY+2,Math.max(0,56*hpRatio),1);
        if(this.heroHealthHitUntil[i]>this.visualTime){const hit=(this.heroHealthHitUntil[i]-this.visualTime)/.42;g.lineStyle(2,0xffffff,.75*hit);g.strokeRoundedRect(barX-1,barY-1,64,10,4);}
        healthFrame.setVisible(true).setPosition(u.x,barY+4).setDisplaySize(84,21).setAlpha(low ? .82+Math.sin(this.visualTime*9)*.18 : 1).setTint(low?0xff8193:0xffffff);
      }else healthFrame.setVisible(false);
      const skillRemaining=Math.max(0,(u.skillEffectUntil??0)-m.time),skillDuration=Math.max(.01,u.skillEffectDuration??0),skillRatio=Phaser.Math.Clamp(skillRemaining/skillDuration,0,1);
      const auras=heroAuras(u,m.time,parseInt(heroById[u.heroId].color.slice(1),16));
      for(let auraIndex=0;auraIndex<auras.length;auraIndex++){
        const aura=auras[auraIndex],phase=this.visualTime*(aura.kind==='haste'?4.8:2.6)+u.uid*.7+auraIndex,baseRadius=30+auraIndex*5,pulse=1+Math.sin(phase)*.08;
        g.lineStyle(aura.kind==='skill'?3:2,aura.color,(aura.kind==='skill' ? .7 : .48)*aura.strength);
        g.strokeCircle(u.x,u.y+17,baseRadius*pulse);
        if(aura.kind==='skill'){
          g.lineStyle(1,0xffffff,.32);g.strokeCircle(u.x,u.y+17,(baseRadius+7)*(1+Math.sin(phase+1)*.05));
          for(let p=0;p<3;p++){const a=phase+p*Math.PI*2/3;g.fillStyle(aura.color,.72);g.fillCircle(u.x+Math.cos(a)*(baseRadius+5),u.y+17+Math.sin(a)*(baseRadius+5),3);}
        }else{
          const a=phase+auraIndex;g.fillStyle(aura.color,.66);g.fillCircle(u.x+Math.cos(a)*baseRadius,u.y+17+Math.sin(a)*baseRadius,2.5);
        }
      }
      if(u.hp>0&&skillRatio>0){
        g.fillStyle(0x160f2d,.94);g.fillRoundedRect(barX,barY-9,62,6,2);
        g.lineStyle(1,0xb98cff,.9);g.strokeRoundedRect(barX,barY-9,62,6,2);
        skillGauge.setVisible(true).setPosition(barX+1,barY-6).setCrop(45,395,Math.max(1,Math.round(1640*skillRatio)),95).setDisplaySize(60*skillRatio,4).setAlpha(.9+.1*Math.sin(this.visualTime*8));
      }else skillGauge.setVisible(false);
      if ((u.shots !== this.heroShotCounts[i] || u.droneShots !== this.heroDroneShotCounts[i]) &&
          this.visualTime - this.heroAttackStarted[i] >= ATTACK_SECONDS) {
        this.heroShotCounts[i] = u.shots;
        this.heroDroneShotCounts[i] = u.droneShots;
        this.heroAttackStarted[i] = this.visualTime;
      }
      const attackElapsed = this.visualTime - (this.heroAttackStarted[i] ?? -999);
      const attacking = attackElapsed >= 0 && attackElapsed < ATTACK_SECONDS && u.hp > 0;
      const heroAnimFrame = attacking
        ? visualFrame(attackElapsed)
        : 1;
      const north = !!u.facingUp && this.textures.exists(`hero-${u.heroId}-up-1`);
      const upFrame = attacking ? [1,2,3,4,5,6,6,1][heroAnimFrame-1] : 1;
      const idle=m.time-(u.lastAttackAt??-999)>=1;
      const skillElapsed=m.time-(u.skillCastAt??-999),skillCasting=skillElapsed>=0&&skillElapsed<.9&&u.hp>0;
      const skillFrame=Math.min(6,Math.floor(skillElapsed/.15)+1);
      const textureKey = skillCasting ? `hero-${u.heroId}-skill-${skillFrame}` : idle ? `hero-${u.heroId}-idle-front` : north ? `hero-${u.heroId}-up-${upFrame}` : animatedHero
        ? `hero-${u.heroId}-anim-${heroAnimFrame}`
        : heroById[u.heroId].asset.key;
      sp.setVisible(true);
      if (sp.texture.key !== textureKey)
        sp.setTexture(textureKey, animatedHero ? undefined : heroById[u.heroId].asset.frame);
      sp.setAlpha(u.hp <= 0 ? 0.25 : u.stunned ? 0.55 : 1)
        .setDepth(this.dragUid===u.uid?800:20+u.y);
      const size=poseSize(u.heroId,north,idle);
      sp.setDisplaySize(size,size);
      // Source art faces right. Use the real shot target, not a nearby bystander.
      sp.setFlipX(!idle && !north && (u.facingLeft ?? false));
      if (u.uid !== this.dragUid) sp.setPosition(u.x, u.y + HERO_RENDER.offsetY);
      label
        .setVisible(true)
        .setPosition(u.x, u.y + 25)
        .setText("★".repeat(u.star))
        .setDepth(650);
      const calloutAge=m.time-(u.skillCalloutAt??-99),showCallout=u.hp>0&&!!u.skillCallout&&calloutAge>=0&&calloutAge<1.4;
      skillCallout.setVisible(showCallout);
      if(showCallout){
        const appear=Math.min(1,calloutAge/.12),fade=Math.min(1,(1.4-calloutAge)/.32);
        skillCallout.setText(`${u.skillCallout}!`).setPosition(u.x,Math.max(28,u.y-91-calloutAge*12))
          .setAlpha(Math.min(appear,fade)).setScale(.9+.1*appear);
      }
      if ((heroById[u.heroId].build === "drone" || m.builds.drone) && !m.actions.some(a=>a.active&&a.kind==="drone"&&a.owner===u.uid)) {
        const {x:dx,y:dy} = dronePoint(u,m.time);
        this.droneSprites[i].setVisible(true).setPosition(dx,dy).setDisplaySize(34,34)
          .setAngle(Math.sin(m.time*2+u.uid)*5).setDepth(30+dy);
      } else this.droneSprites[i].setVisible(false);
    }
    this.reactionLabels.forEach(l=>l.setVisible(false));let reactionIndex=0;
    for(const e of m.enemies)if(e.active&&e.reactionTime>0&&e.reactionKind&&reactionIndex<8)this.reactionLabels[reactionIndex++].setVisible(true).setText(reactionNames[e.reactionKind as keyof typeof reactionNames]??e.reactionKind).setPosition(Math.max(45,Math.min(755,e.x)),Math.max(15,e.y-50)).setAlpha(Math.min(1,e.reactionTime*4));
    this.damageLabels.forEach((label,i)=>{const n=m.damageNumbers[i];label.setVisible(n.life>0);if(n.life>0)label.setColor(n.critical?"#ffb873":"#fff3b0").setText(`${Math.round(n.value)}${n.critical?"!":""}`).setPosition(Math.max(20,Math.min(MAP.width-20,n.x)),Math.max(16,n.y-(.65-n.life)*38)).setAlpha(Math.min(1,n.life*4));});
    for (const e of m.enemies) {
      const sp = this.enemySprites[e.index];
      const shadow=this.enemyShadowSprites[e.index];
      const step=this.enemyStepSprites[e.index];
      if (!e.active) {
        sp.setVisible(false);
        shadow.setVisible(false);
        step.setVisible(false);
        for(let si=0;si<4;si++)this.enemyStatusSprites[e.index*4+si].setVisible(false);
        this.enemyMarkSprites[e.index].setVisible(false);
        continue;
      }
      const boss = !!enemies[e.kind].boss;
      const named=!!enemies[e.kind].namedRegion,namedWarning=named&&e.namedSkillTimer>=5.1,bossWarning=boss&&!e.strikeAt&&e.attackTimer>=(enemies[e.kind].bossTier==='mid'?8.5:10.2);
      if(namedWarning||bossWarning){const warningProgress=namedWarning?Math.min(1,(e.namedSkillTimer-5.1)/1.4):Math.min(1,(e.attackTimer-(enemies[e.kind].bossTier==='mid'?8.5:10.2))/1.8),warningColor=boss?0xff625f:0xffbd66,r=(boss?76:54)*(1-warningProgress*.12);g.fillStyle(warningColor,.05+warningProgress*.1);g.fillCircle(e.x,e.y,r);g.lineStyle(6,0x190b0b,.72);g.strokeCircle(e.x,e.y,r);g.lineStyle(3,warningColor,.55+warningProgress*.45);for(let a=0;a<Math.PI*2;a+=Math.PI/2)g.arc(e.x,e.y,r,a,a+Math.PI*.32,false);g.strokePath();}
      sp.setVisible(true);
      const enemySize=boss ? 126 : (enemies[e.kind].armor ? 76 : 68);
      const ahead={x:e.x,y:e.y};
      const route=e.route&&m.campaign?.alternate?m.campaign.alternate:m.map;route.pathPoint(Math.min(route.pathLength,e.progress+4),ahead);
      const motion=enemyMotion(this.visualTime,e.index,e.speed,boss,ahead.x-e.x,ahead.y-e.y);
      const bodyCount=this.enemyMoveFrames[e.kind]??enemyMoveFrameCount(boss,false),bodyCadence=Math.max(3,Math.min(9,e.speed/9))*(boss?.65:1),bodyFrame=1+Math.floor((this.visualTime*bodyCadence+e.index*.41)%bodyCount);
      const firing=!!enemies[e.kind].ranged&&e.rangedFiredAt!==undefined&&m.time-e.rangedFiredAt<.32;
      const fireFrame=firing?Math.min(3,Math.floor((m.time-e.rangedFiredAt!)/.32*3)+1):0;
      const requestedTexture=firing?`enemy-${e.kind}-fire-${fireFrame}`:`enemy-${e.kind}-move-${bodyFrame}`;
      const staticTexture=`enemy-${e.kind}`;
      const enemyTexture=this.textureReady(requestedTexture)?requestedTexture:this.textureReady(staticTexture)?staticTexture:this.initialEnemyKey;
      if(sp.texture.key!==enemyTexture)sp.setTexture(enemyTexture);
      const generation=e.generation??e.index;
      if(this.enemyVisualGeneration[e.index]!==generation){
        this.enemyVisualGeneration[e.index]=generation;
        this.enemyVisualHp[e.index]=e.hp;
        this.enemyHitUntil[e.index]=0;
        this.enemyNextHitFlash[e.index]=0;
      }else if(e.hp<this.enemyVisualHp[e.index]&&this.visualTime>=(this.enemyNextHitFlash[e.index]??0)){
        this.enemyHitUntil[e.index]=this.visualTime+.055;
        this.enemyNextHitFlash[e.index]=this.visualTime+.28;
      }
      this.enemyVisualHp[e.index]=e.hp;
      const hit=this.visualTime<this.enemyHitUntil[e.index];
      const dirLength=Math.max(1,Math.hypot(ahead.x-e.x,ahead.y-e.y));
      const recoil=hit?(boss?2:3):0;
      const renderX=e.x-(ahead.x-e.x)/dirLength*recoil;
      const renderY=e.y-(ahead.y-e.y)/dirLength*recoil-motion.lift;
      if(boss&&this.campaignArea){const regionColors=[0x80e570,0x5fe2e7,0xe99a55,0x8edcff,0x60e2d0,0x78c8ff,0xb06cff,0xf05a8c],a=.34+Math.sin(this.visualTime*3+e.index)*.1,r=48+Math.sin(this.visualTime*2.2+e.index)*3;g.lineStyle(3,regionColors[this.campaignArea-1]??0xa8f7e7,a);g.strokeCircle(e.x,e.y+4,r);g.lineStyle(1,0xe8ffff,a*.65);g.strokeCircle(e.x,e.y+4,r+7);}
      shadow.setVisible(true).setPosition(e.x,e.y+enemySize*.22).setDisplaySize(enemySize*.58*motion.shadowScale,enemySize*(boss?.13:.16)).setDepth(18+e.y).setAlpha(boss?.62:.5);
      const stepKey=`enemy-step-${motion.frame}`,stepReady=this.textureReady(stepKey);
      step.setVisible(stepReady&&motion.stepAlpha>0).setPosition(e.x,e.y+enemySize*.23).setDisplaySize(boss?70:46,boss?35:23).setDepth(19+e.y).setAlpha(motion.stepAlpha);
      if(stepReady&&step.texture.key!==stepKey)step.setTexture(stepKey);
      sp.clearTint().setFlipX(motion.flipX).setAngle(motion.angle).setDisplaySize(enemySize*motion.scaleX,enemySize*motion.scaleY).setPosition(renderX,renderY).setDepth(20+e.y);
      // A short warm multiply tint preserves the authored silhouette. A full
      // white fill made damage-over-time targets disappear under continuous hits.
      if(hit)sp.setTint(0xffc7aa);
      const pulseEvery = enemies[e.kind].boss==='storm'?3:enemies[e.kind].boss==='void'?3.5:4;
      if(!m.campaign&&(enemies[e.kind].disrupt||['frost','storm','void'].includes(enemies[e.kind].boss??''))&&e.attackTimer>pulseEvery-.8){const warning=(e.attackTimer-(pulseEvery-.8))/.8,radius=enemies[e.kind].boss==='storm'?430:enemies[e.kind].boss==='void'?300:enemies[e.kind].boss?350:210;g.fillStyle(enemies[e.kind].boss==='void'?0x9a5cff:enemies[e.kind].boss==='storm'?0x55cfff:0xff7d73,.05+warning*.08);g.fillCircle(e.x,e.y,radius);g.lineStyle(3,enemies[e.kind].boss==='void'?0xb97aff:enemies[e.kind].boss==='storm'?0x75eaff:0xff9388,.35+warning*.55);g.strokeCircle(e.x,e.y,radius*(.92+warning*.08));}
      const width = boss ? 74 : 38;
      g.fillStyle(0x101727);
      g.fillRect(e.x - width / 2, e.y - (boss ? 58 : 34), width, 4);
      g.fillStyle(boss ? 0xf5a178 : 0xc6a9ec);
      g.fillRect(
        e.x - width / 2,
        e.y - (boss ? 58 : 34),
        (width * e.hp) / e.maxHp,
        4,
      );
      const statusKeys=[e.burn?'burn':'',e.bleed?'bleed':'',e.slowTime?'slow':'',e.armorBreakTime?'armor-break':''].filter(Boolean);
      for(let si=0;si<4;si++){const status=this.enemyStatusSprites[e.index*4+si],key=statusKeys[si];status.setVisible(!!key);if(key)status.setTexture(`status-${key}`).setPosition(e.x-(statusKeys.length-1)*9+si*18,e.y+(boss?58:40)).setDisplaySize(16,16).setAlpha(.78+Math.sin(m.time*7+si)*.18);}
      const markKey=e.darkMark?'dark':e.electricMark?'electric':e.fireMark?'fire':e.waterMark?'water':'';
      const mark=this.enemyMarkSprites[e.index];
      mark.setVisible(!!markKey);
      if(markKey){mark.setTexture(`common-${markKey}-mark`).setPosition(e.x+10,e.y+(boss?58:40)).setDisplaySize(15,15);}
      if (e.reactionTime && e.reactionKind) {
        const reactionColor =
          reactionColors[e.reactionKind as keyof typeof reactionColors] ?? 0xffffff;
        const pulse = 13 + (0.5 - e.reactionTime) * 30;
        g.lineStyle(2, reactionColor, Math.min(0.9, e.reactionTime * 2));
        g.strokeCircle(e.x, e.y, pulse);
      }
    }
    for (const sp of this.fxSprites) sp.setVisible(false).setAlpha(1).setAngle(0).clearTint().setScale(1);
    let fxSpriteIndex = 0;
    // Proactive crowd protection: don't wait for an FPS drop when an endless
    // wave suddenly fills the enemy cap. Only visuals are culled.
    const crowdEffectCap =
      m.alive >= 40 ? 16 : m.alive >= 32 ? 24 : m.alive >= 24 ? 36 : this.adaptiveEffectCap;
    const max = Math.min(
      this.adaptiveEffectCap,
      crowdEffectCap,
      m.effects.length,
      this.fxSprites.length,
    );
    let renderedEffects = 0;
    const priority=(f:(typeof m.effects)[number])=>f.visual?.startsWith('enemy-')?8:f.visual==='luna-meteor-impact'?9:f.visual==='sniper-round'?8:f.visual?.startsWith('element-upgrade-')||f.visual?.startsWith('slash-')?7:f.visual?.startsWith('reaction-')||f.visual?.startsWith('transfer-')?6:f.visual?.startsWith('muzzle-flash-')?2:4;
    const effectIndices=m.effects.map((f,i)=>({f,i})).filter(v=>v.f.life>0).sort((a,b)=>priority(b.f)-priority(a.f)).map(v=>v.i);
    for (const i of effectIndices) {if(renderedEffects>=max)break;
      const f = m.effects[i];
      if (f.life <= 0) continue;
      renderedEffects++;
      const duration = f.duration || (f.type === "shot" ? 0.25 : 0.5);
      const rawProgress = Phaser.Math.Clamp(1 - f.life / duration, 0, 1);
      const progress = rawProgress;
      const frame = Math.min(3,visualFrame(duration - f.life));
      if(f.visual?.startsWith('support-skill-')&&fxSpriteIndex<this.fxSprites.length){
        const sp=this.fxSprites[fxSpriteIndex++],id=f.visual.slice('support-skill-'.length),skillFrame=Math.min(4,Math.floor(progress*4)+1),size=(f.radius??135)*2*(.82+progress*.18);
        sp.setTexture(`support-skill-${id}-${skillFrame}`).clearTint().setPosition(f.tx,f.ty).setDisplaySize(size,size).setRotation(0).setAlpha(skillFrame===4?1-progress*.6:.98).setDepth(677).setVisible(true);
        continue;
      }
      if(f.visual?.startsWith('tank-guard-hit-')&&fxSpriteIndex<this.fxSprites.length){
        const sp=this.fxSprites[fxSpriteIndex++],id=f.visual.slice('tank-guard-hit-'.length),hitFrame=Math.min(3,Math.floor(progress*3)+1),size=(f.radius??34)*2*(.7+progress*.55);
        sp.setTexture(`support-skill-${id}-${hitFrame}`).clearTint().setPosition(f.tx,f.ty).setDisplaySize(size,size).setRotation(0).setAlpha(1-progress).setDepth(678).setVisible(true);
        continue;
      }
      if(f.visual?.startsWith('hero-defeat-')&&fxSpriteIndex<this.fxSprites.length){
        const sp=this.fxSprites[fxSpriteIndex++],hero=f.visual.slice('hero-defeat-'.length),phase=Math.min(2,Math.floor(progress*3));
        sp.setTexture(`hero-${hero}-defeat-${phase+1}`).clearTint().setPosition(f.x,f.y+HERO_RENDER.offsetY)
          .setDisplaySize(defeatPoseSize(hero),defeatPoseSize(hero)).setAngle(0)
          .setAlpha(phase<2?1:1-progress).setDepth(675).setVisible(true);
        continue;
      }
      if(f.type === "shot" && f.sourceHero && !f.originResolved){
        const idx=m.units.findIndex(u=>u.uid===f.sourceUid);
        const key=idx>=0?this.heroSprites[idx]?.texture.key??"":"";
        const actual=key.match(f.sourceNorth?/-up-(\d+)$/:/-anim-(\d+)$/);
        const pose=actual?Number(actual[1]):1;
        const origin=weaponPoint(f.sourceHero,{x:f.x,y:f.y},!!f.sourceNorth,!!f.sourceLeft,pose);
        f.x=origin.x;f.y=origin.y;f.originResolved=true;
      }
      if (f.visual?.startsWith("summon-") && fxSpriteIndex < this.fxSprites.length) {
        const sp = this.fxSprites[fxSpriteIndex++];
        const grade = f.visual.slice("summon-".length);
        const key = `summon-${grade}`;
        if (sp.texture.key !== key) sp.setTexture(key);
        const pulse = 84 + progress * 68;
        sp.setVisible(true)
          .setPosition(f.tx, f.ty - 8)
          .setDisplaySize(pulse, pulse)
          .setAngle(progress * 90)
          .setAlpha(Math.sin(Math.PI * Math.min(1, progress)) * 0.95)
          .setDepth(640);
        continue;
      }
      if(f.visual?.startsWith('transfer-')){
        if(fxSpriteIndex<this.fxSprites.length){
          const sp=this.fxSprites[fxSpriteIndex++],dx=f.tx-f.x,dy=f.ty-f.y,element=f.visual.slice(9);
          const distance=Math.hypot(dx,dy),thickness=element==='electric'?34:element==='dark'?38:30,transferFrame=Math.min(4,Math.floor(progress*4)+1);
          const elementColor=element==='water'?0x7be9ff:element==='fire'?0xff8c59:element==='dark'?0xb995ff:0xfff09a;
          sp.clearTint().setTexture(`transfer-${element}-${transferFrame}`).setPosition((f.x+f.tx)/2,(f.y+f.ty)/2)
            .setDisplaySize(Math.max(24,distance),thickness*(.9+Math.sin(Math.PI*progress)*.16))
            .setRotation(Math.atan2(dy,dx)).setAlpha(transferFrame===4?1-progress:.95).setDepth(668).setVisible(true);
          if(fxSpriteIndex<this.fxSprites.length){
            const node=this.fxSprites[fxSpriteIndex++],travel=Phaser.Math.Easing.Cubic.Out(Math.min(1,progress*1.18));
            node.setTexture('reaction-generated').setTint(elementColor).setPosition(Phaser.Math.Linear(f.x,f.tx,travel),Phaser.Math.Linear(f.y,f.ty,travel))
              .setDisplaySize(18+Math.sin(progress*Math.PI)*12,18+Math.sin(progress*Math.PI)*12).setRotation(progress*2).setAlpha(1-progress*.65).setDepth(670).setVisible(true);
          }
          if(progress>.68&&fxSpriteIndex<this.fxSprites.length){
            const arrival=this.fxSprites[fxSpriteIndex++],arrivalProgress=(progress-.68)/.32;
            arrival.setTexture('reaction-generated').setTint(elementColor).setPosition(f.tx,f.ty).setDisplaySize(24+arrivalProgress*42,24+arrivalProgress*42)
              .setRotation(arrivalProgress*.8).setAlpha(1-arrivalProgress).setDepth(669).setVisible(true);
          }
        }
        continue;
      }
      if(f.visual?.startsWith('arc-')||f.visual==='rail-beam'){
        if(fxSpriteIndex<this.fxSprites.length){const sp=this.fxSprites[fxSpriteIndex++],dx=f.tx-f.x,dy=f.ty-f.y;sp.setTexture(f.visual==='rail-beam'?'vfx-bullet':'vfx-lightning').setTint(f.visual==='arc-void'?0xcf89ff:0xffffff).setPosition((f.x+f.tx)/2,(f.y+f.ty)/2).setDisplaySize(Math.max(10,Math.hypot(dx,dy)),f.visual==='rail-beam'?18:34).setRotation(Math.atan2(dy,dx)).setAlpha(1-progress).setVisible(true);}
        continue;
      }
      if(f.visual?.startsWith('muzzle-flash-')){
        if(fxSpriteIndex<this.fxSprites.length){const sp=this.fxSprites[fxSpriteIndex++],hero=f.visual.slice('muzzle-flash-'.length),flashFrame=Math.min(3,Math.floor(progress*3)+1);sp.setTexture(`fx-${hero}-projectile-${flashFrame}`).setPosition(f.x,f.y).setDisplaySize(34-progress*12,22-progress*8).setRotation(progress*.35).setAlpha(1-progress).setDepth(673).setVisible(true);}continue;
      }
      if(f.visual?.startsWith('element-upgrade-')){
        if(fxSpriteIndex<this.fxSprites.length){const sp=this.fxSprites[fxSpriteIndex++],size=(f.radius??62)*2*(.55+progress*.75);sp.setTexture('reaction-generated').setTint(f.color).setPosition(f.tx,f.ty).setDisplaySize(size,size).setRotation(progress*.35).setAlpha(1-progress).setDepth(650).setVisible(true);}continue;
      }
      if(f.visual==='luna-meteor-impact'){
        if(fxSpriteIndex<this.fxSprites.length){const sp=this.fxSprites[fxSpriteIndex++],impactFrame=Math.min(4,Math.floor(progress*4)+1),size=(f.radius??120)*1.5*(.72+progress*.42);sp.setTexture(`luna-meteor-impact-${impactFrame}`).setPosition(f.tx,f.ty).setDisplaySize(size,size).setAlpha(1-progress*.45).setDepth(674).setVisible(true);}continue;
      }
      if(f.visual==='sniper-round'){
        if(fxSpriteIndex<this.fxSprites.length){
          const sp=this.fxSprites[fxSpriteIndex++],dx=f.tx-f.x,dy=f.ty-f.y,angle=Math.atan2(dy,dx),travel=progress;
          const x=Phaser.Math.Linear(f.x,f.tx,travel),y=Phaser.Math.Linear(f.y,f.ty,travel),tail=Math.max(0,travel-.12),tailX=Phaser.Math.Linear(f.x,f.tx,tail),tailY=Phaser.Math.Linear(f.y,f.ty,tail);
          g.lineStyle(8,f.color,.16);g.lineBetween(tailX,tailY,x,y);g.lineStyle(3,0xeaffff,.82);g.lineBetween(tailX,tailY,x,y);
          sp.setTexture('sniper-round-v2').clearTint().setPosition(x,y)
            .setDisplaySize(124,28).setRotation(angle).setAlpha(1-progress*.08).setDepth(672).setVisible(true);
        }
        continue;
      }
      if(f.visual==='sniper-muzzle'){
        if(fxSpriteIndex<this.fxSprites.length){
          const sp=this.fxSprites[fxSpriteIndex++],frame=Math.min(3,Math.floor(progress*3)+1),angle=Math.atan2(f.ty-f.y,f.tx-f.x),width=150,height=57;
          sp.setTexture(`sniper-muzzle-${frame}`).clearTint().setPosition(f.x+Math.cos(angle)*width*.46,f.y+Math.sin(angle)*width*.46)
            .setDisplaySize(width,height).setRotation(angle).setAlpha(frame===3?1-progress:.98).setDepth(673).setVisible(true);
        }continue;
      }
      if(f.visual==='enemy-rift-bolt'){
        if(fxSpriteIndex<this.fxSprites.length){
          const boltFrame=Math.min(3,Math.floor(progress*9)%3+1),key=`enemy-rift-bolt-${boltFrame}`;
          if(!this.textureReady(key))continue;
          const sp=this.fxSprites[fxSpriteIndex++],dx=f.tx-f.x,dy=f.ty-f.y,angle=Math.atan2(dy,dx),travel=Phaser.Math.Easing.Quadratic.InOut(progress);
          sp.setTexture(key).clearTint().setPosition(Phaser.Math.Linear(f.x,f.tx,travel),Phaser.Math.Linear(f.y,f.ty,travel))
            .setDisplaySize(58,25).setRotation(angle+Math.PI).setAlpha(1-progress*.12).setDepth(674).setVisible(true);
        }
        continue;
      }
      if(f.visual==='enemy-ranged-impact'){
        if(fxSpriteIndex<this.fxSprites.length){const impactFrame=Math.min(3,Math.floor(progress*3)+1),key=`enemy-ranged-impact-${impactFrame}`;if(!this.textureReady(key))continue;const sp=this.fxSprites[fxSpriteIndex++],size=(f.radius??38)*2.2;sp.setTexture(key).clearTint().setPosition(f.tx,f.ty).setDisplaySize(size,size).setRotation(0).setAlpha(impactFrame===3?1-progress:.95).setDepth(676).setVisible(true);}
        continue;
      }
      if(f.visual?.startsWith('slash-')){
        if(fxSpriteIndex<this.fxSprites.length){
          const sp=this.fxSprites[fxSpriteIndex++],r=Phaser.Math.Clamp(f.radius??100,90,175),angle=Math.atan2(f.ty-f.y,f.tx-f.x),slashFrame=Math.min(4,Math.floor(progress*4)+1);
          const reach=r*(.38+progress*.12),width=r*(.82+progress*.18),height=r*(1.05+progress*.12);
          sp.setTexture(`slash-anim-${slashFrame}`).setTint(f.color).setPosition(f.x+Math.cos(angle)*reach,f.y+Math.sin(angle)*reach)
            .setDisplaySize(width,height).setRotation(angle-.24+progress*.48).setAlpha(slashFrame===4?1-progress:.92).setDepth(666).setVisible(true);
          if(progress>.42&&fxSpriteIndex<this.fxSprites.length){
            const after=this.fxSprites[fxSpriteIndex++];
            after.setTexture(`slash-anim-${Math.min(4,slashFrame+1)}`).setTint(f.color).setPosition(f.x+Math.cos(angle)*reach*.9,f.y+Math.sin(angle)*reach*.9)
              .setDisplaySize(width*.92,height*.92).setRotation(angle-.34+progress*.42).setAlpha((1-progress)*.38).setDepth(665).setVisible(true);
          }
        }continue;
      }
      if(f.visual?.startsWith('reaction-')){
        if(fxSpriteIndex<this.fxSprites.length){const sp=this.fxSprites[fxSpriteIndex++];sp.setTexture('reaction-generated').setTint(f.color).setPosition(f.tx,f.ty).setDisplaySize(62+progress*46,62+progress*46).setRotation(progress*.32).setAlpha((1-progress)*.46).setDepth(649).setVisible(true);}continue;
      }
      if (f.visual?.startsWith('drone-') && fxSpriteIndex < this.fxSprites.length) {
        const sp=this.fxSprites[fxSpriteIndex++], key=f.visual;
        if(sp.texture.key!==key)sp.setTexture(key);
        if(f.type==='shot'){
          const x=Phaser.Math.Linear(f.x,f.tx,progress), y=Phaser.Math.Linear(f.y,f.ty,progress);
          const angle=Math.atan2(f.ty-f.y,f.tx-f.x), rect=fitProjectile(x,y,42,18,angle,MAP);
          sp.setVisible(true).setPosition(rect.x,rect.y).setAngle(Phaser.Math.RadToDeg(angle)).setDisplaySize(rect.width,rect.height).setAlpha(1-progress*.35).setDepth(665);
        }else{
          const size=(f.visual==='drone-overcharge'?110:58)*(.65+progress*.45),rect=fitVisual(f.tx,f.ty,size,size,progress*.3,MAP);
          sp.setVisible(true).setPosition(rect.x,rect.y).setDisplaySize(rect.width,rect.height).setAngle(progress*70).setAlpha(1-progress*.75).setDepth(655);
        }
        continue;
      }
      if (f.visual?.startsWith('enemy-')&&!f.visual.startsWith('enemy-death-')&&!f.visual.startsWith('enemy-core-') && fxSpriteIndex < this.fxSprites.length) {
        const sp=this.fxSprites[fxSpriteIndex++], key=`enemy-fx-${f.visual.slice(6)}`;
        if(!this.textureReady(key)){fxSpriteIndex--;continue;}
        if(sp.texture.key!==key)sp.setTexture(key);
        const size=(f.visual==='enemy-disrupt'?92:168)*(.65+progress*.45),rect=fitVisual(f.tx,f.ty,size,size,progress*.35,MAP);
        sp.setVisible(true).setPosition(rect.x,rect.y).setDisplaySize(rect.width,rect.height).setAngle(progress*55).setAlpha(.9-progress*.65).setDepth(655);
        continue;
      }
      if(f.visual?.startsWith('enemy-death-')&&fxSpriteIndex<this.fxSprites.length){
        const sp=this.fxSprites[fxSpriteIndex++],kind=f.visual.slice('enemy-death-'.length),size=enemies[kind]?.boss?126:enemies[kind]?.armor?76:68,frame=Math.min(3,Math.floor(progress*3)+1);
        const requested=this.regionalEnemyVisuals.has(kind)?`enemy-${kind}-death-${frame}`:`enemy-${kind}`;
        const deathKey=this.textureReady(requested)?requested:this.textureReady(`enemy-${kind}`)?`enemy-${kind}`:this.initialEnemyKey;
        sp.setTexture(deathKey).clearTint().setPosition(f.tx,f.ty-progress*7).setDisplaySize(size,size).setAngle(0).setAlpha(frame===3?Math.max(0,1-progress):1).setDepth(675).setVisible(true);continue;
      }
      if(f.visual?.startsWith('enemy-core-')&&fxSpriteIndex<this.fxSprites.length){const sp=this.fxSprites[fxSpriteIndex++],kind=f.visual.slice('enemy-core-'.length),size=enemies[kind]?.boss?126:enemies[kind]?.armor?76:68,key=this.textureReady(`enemy-${kind}`)?`enemy-${kind}`:this.initialEnemyKey;sp.setTexture(key).setTint(0xffc6b5).setPosition(f.tx-progress*18,f.ty).setDisplaySize(size*(1+progress*.25),size*(1-progress*.18)).setAlpha(1-progress).setDepth(676).setVisible(true);continue;}
      if (f.visual?.startsWith('common-') && fxSpriteIndex < this.fxSprites.length) {
        const sp=this.fxSprites[fxSpriteIndex++];
        if(sp.texture.key!==f.visual)sp.setTexture(f.visual);
        const size=74*(.7+progress*.4),rect=fitVisual(f.tx,f.ty,size,size,progress*.25,MAP);
        sp.setVisible(true).setPosition(rect.x,rect.y).setDisplaySize(rect.width,rect.height).setAngle(progress*35).setAlpha(.55-progress*.42).setDepth(648);
        continue;
      }
      const visualHero = f.visual?.split("-")[0] ?? "";
      const supportedVisual = this.activeHeroIds.has(visualHero);
      if (f.visual && supportedVisual && fxSpriteIndex < this.fxSprites.length) {
        const sp = this.fxSprites[fxSpriteIndex++];
        const alpha = 1 - progress * 0.55;
        if (f.visual.endsWith("-projectile")) {
          const key = `fx-${visualHero}-projectile-${frame}`;
          const x = Phaser.Math.Linear(f.x, f.tx, progress);
          const y = Phaser.Math.Linear(f.y, f.ty, progress);
          const width = heroVisuals[visualHero].projectile;
          const angle = Math.atan2(f.ty - f.y, f.tx - f.x);
          if (sp.texture.key !== key) sp.setTexture(key);
          const height = width * sp.frame.realHeight / sp.frame.realWidth;
          const rect = fitProjectile(x,y,width,height,angle,MAP);
          sp
            .setVisible(true)
            .setPosition(rect.x, rect.y)
            .setAngle(Phaser.Math.RadToDeg(angle))
            .setDisplaySize(rect.width, rect.height)
            .setAlpha(alpha)
            .setDepth(660);
        } else {
          const barrier = f.visual === "yuria-barrier";
          const skill = f.visual.endsWith("-skill");
          const key = barrier
            ? "fx-yuria-barrier"
            : skill
              ? `fx-${visualHero}-skill`
              : `fx-${visualHero}-impact-${frame}`;
          const size = (barrier ? 104 : skill ? Math.max(heroVisuals[visualHero].skill,f.radius??0) : heroVisuals[visualHero].impact) * (skill?.72:.65+progress*(skill?.58:.35));
          const angle = progress * (barrier ? 0.16 : skill ? 0.32 : 0.12);
          const rect = fitVisual(f.tx,f.ty,size,size,angle,MAP);
          if (sp.texture.key !== key) sp.setTexture(key);
          sp
            .setVisible(true)
            .setPosition(rect.x, rect.y)
            .setAngle(Phaser.Math.RadToDeg(angle))
            .setDisplaySize(rect.width, rect.height)
            .setAlpha((barrier ? 0.42 : skill ? 0.7 : 0.5) * (skill?Math.sin(Math.PI*Math.min(1,progress*1.08)):1-progress*0.8))
            .setDepth(barrier ? 625 : skill ? 677 : 650);
          if(skill&&fxSpriteIndex<this.fxSprites.length){
            const impact=this.fxSprites[fxSpriteIndex++],impactFrame=Math.min(3,Math.floor(progress*3)+1),pulse=(f.radius??110)*(1.05+progress*.65);
            impact.setTexture(`fx-${visualHero}-impact-${impactFrame}`).clearTint().setPosition(f.tx,f.ty)
              .setDisplaySize(pulse*.78,pulse*.78).setRotation(-progress*.22).setAlpha(impactFrame===3?(1-progress)*.5:.56).setDepth(678).setVisible(true);
          }
          if(skill&&progress<.58&&fxSpriteIndex<this.fxSprites.length){
            const cast=this.fxSprites[fxSpriteIndex++],castProgress=progress/.58,castSize=46+castProgress*54;
            cast.setTexture(`fx-${visualHero}-skill`).clearTint().setPosition(f.x,f.y)
              .setDisplaySize(castSize,castSize).setRotation(castProgress*.28).setAlpha((1-castProgress)*.82).setDepth(676).setVisible(true);
          }
        }
        continue;
      }
      if(fxSpriteIndex<this.fxSprites.length){
        const sp=this.fxSprites[fxSpriteIndex++];
        if(f.type==='shot'){const dx=f.tx-f.x,dy=f.ty-f.y;sp.setTexture('vfx-bullet').setPosition((f.x+f.tx)/2,(f.y+f.ty)/2).setDisplaySize(Math.max(16,Math.hypot(dx,dy)),14).setRotation(Math.atan2(dy,dx));}
        else{const size=40+progress*70;sp.setTexture(f.type==='merge'?'vfx-reticle':'vfx-impact').setPosition(f.tx,f.ty).setDisplaySize(size,size).setRotation(progress*.5);}
        sp.setVisible(true).setAlpha(1-progress).setTint(f.color);
      }
    }
    g.setDepth(700);
    // DOM HUD does not need to update at the Phaser render rate. Keep combat
    // rendering at 60/120Hz, but refresh the HTML HUD at ~10Hz or immediately
    // when the model revision changes. This removes a major PC/mobile layout cost.
    this.hudElapsed += delta;
    if (this.hudElapsed >= 100 || m.revision !== this.lastHudRevision) {
      this.hudElapsed = 0;
      this.lastHudRevision = m.revision;
      this.callback();
    }
  }
}

