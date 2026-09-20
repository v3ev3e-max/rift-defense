import {it,expect} from 'vitest';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {attack,stepActions,castAutoSkill,SNIPER_ROUND_SPEED} from '../src/systems/ActionCombat';
import {combatRoles} from '../src/data/combatRoles';
import {heroes} from '../src/data/heroes';
import {poseSize,weaponPoint} from '../src/game/WeaponSockets';
const fixture=(id='sera',star=1)=>{const m=new BattleModel(defaultSave(),()=>.99),u=m.addUnit(id,star);m.spawn('brute');const e=m.enemies[0];e.x=u.x+55;e.y=u.y;e.hp=e.maxHp=10000;e.armor=0;return {m,u,e};};
const advance=(m:BattleModel,seconds:number)=>{for(let i=0;i<Math.ceil(seconds*60);i++){m.time+=1/60;stepActions(m,1/60);}};
it('burst damage arrives as three distinct timed hits and preserves launch position after moving',()=>{
 const {m,u,e}=fixture();attack(m,u,e);const a=m.actions.find(a=>a.active)!,x=a.x,y=a.y;expect(e.hp).toBe(10000);u.x+=110;advance(m,.15);const first=e.hp;expect(first).toBeLessThan(10000);expect(a.x).toBe(x);expect(a.y).toBe(y);advance(m,.2);expect(e.hp).toBeLessThan(first);expect(m.records[0].parts.basic).toBeGreaterThan(0);
});
it('machinegun attacks use muzzle flashes and target impacts without bent beam or transfer trails',()=>{
 const {m,u,e}=fixture('sera',5);m.spawn('brute');const extra=m.enemies[1];extra.x=e.x+25;extra.y=e.y;extra.hp=extra.maxHp=10000;extra.armor=0;
 attack(m,u,e);advance(m,.8);u.skillCharge=100;expect(castAutoSkill(m,u,e)).toBe(true);advance(m,.5);
 expect(m.effects.some(f=>f.visual==='muzzle-flash-sera')).toBe(true);
 expect(m.effects.some(f=>f.visual==='sera-impact')).toBe(true);
 expect(m.effects.some(f=>f.visual==='rail-beam'||f.visual?.startsWith('transfer-'))).toBe(false);
});
it('Serin normal attacks restore the animated curse beam and target impact',()=>{
 const {m,u,e}=fixture('serin');attack(m,u,e);advance(m,.3);
 expect(m.effects.some(f=>f.visual==='serin-projectile'&&f.x!==f.tx)).toBe(true);
 expect(m.effects.some(f=>f.visual==='serin-impact')).toBe(true);
 expect(e.vulnerabilityTime).toBeGreaterThan(0);
});
it('sniper aims first and pierces only the forward narrow firing line',()=>{
 const {m,u,e}=fixture('arin',3);e.x=u.x+100;e.y=u.y;
 m.spawn('brute');m.spawn('brute');const along=m.enemies[1],outside=m.enemies[2];
 attack(m,u,e);const a=m.actions.find(a=>a.active)!;along.x=a.x+(e.x-a.x)*.7;along.y=a.y+(e.y-a.y)*.7;outside.x=along.x;outside.y=along.y+60;
 for(const v of [along,outside])v.hp=v.maxHp=10000;
 advance(m,.3);expect(e.hp).toBe(10000);advance(m,.6);expect(e.hp).toBeLessThan(10000);expect(along.hp).toBeLessThan(10000);expect(outside.hp).toBe(10000);
});
it('sniper fires after aiming and never damages more than three aligned enemies',()=>{
 const {m,u,e}=fixture('arin',5);e.x=u.x+70;e.y=u.y;const sounds:string[]=[];m.onSound=s=>sounds.push(s);
 for(let i=0;i<3;i++){m.spawn('brute');const v=m.enemies[i+1];v.x=u.x+90+i*25;v.y=u.y;v.hp=v.maxHp=10000;v.armor=0;}
 attack(m,u,e);expect(sounds).not.toContain('sniper');advance(m,.4);expect(sounds).not.toContain('sniper');advance(m,.75);
 expect(sounds).toContain('sniper');expect(m.enemies.slice(0,4).filter(v=>v.hp<10000)).toHaveLength(3);
 expect(m.effects.some(f=>f.life>0&&f.visual==='sniper-round')).toBe(true);
});
it('sniper acquires a target in range then sends its round through the whole map',()=>{
 const {m,u,e}=fixture('arin',1);e.x=u.x+55;e.y=u.y;
 for(let i=0;i<3;i++){m.spawn('brute');const v=m.enemies[i+1];v.x=Math.min(790,u.x+260+i*70);v.y=u.y;v.hp=v.maxHp=10000;v.armor=0;}
 attack(m,u,e);advance(m,1.5);
 expect(m.enemies.slice(0,4).filter(v=>v.hp<10000)).toHaveLength(3);
 const round=m.effects.find(f=>f.visual==='sniper-round')!;expect(round.tx).toBe(800);expect(round.ty).toBeCloseTo(round.y);
});
it('sniper projectile uses one constant map speed with a visible muzzle effect',()=>{const {m,u,e}=fixture('arin');attack(m,u,e);advance(m,1);const round=m.effects.find(f=>f.visual==='sniper-round')!,muzzle=m.effects.find(f=>f.visual==='sniper-muzzle');expect(muzzle).toBeTruthy();expect(round.duration).toBeCloseTo(Math.hypot(round.tx-round.x,round.ty-round.y)/SNIPER_ROUND_SPEED);});
it('drone deals damage on arrival and remains active during return',()=>{
 const {m,u,e}=fixture('ian');attack(m,u,e);advance(m,.3);expect(e.hp).toBe(10000);advance(m,.5);expect(e.hp).toBeLessThan(10000);expect(m.actions.some(a=>a.active&&a.hit)).toBe(true);advance(m,.6);expect(m.actions.some(a=>a.active)).toBe(false);expect(m.records[0].parts.drone).toBeGreaterThan(0);
});
it('a recycled enemy cannot inherit a projectile aimed at the former occupant',()=>{
 const {m,u,e}=fixture();attack(m,u,e);e.active=false;m.spawn('brute');e.hp=e.maxHp=10000;advance(m,1);expect(e.hp).toBe(10000);
});
it('meteor announces its skill above the caster and applies cost/cooldown exactly once',()=>{
 const {m,u,e}=fixture('luna');const sounds:string[]=[];m.onSound=s=>sounds.push(s);u.skillCharge=100;expect(castAutoSkill(m,u,e)).toBe(true);expect(m.notice).toContain('루나');expect(u.skillCallout).toBe('SUPERNOVA');expect(u.skillCalloutAt).toBe(m.time);expect(sounds).toContain('skill-impact');expect(u.skillCharge).toBe(0);expect(u.skillReadyAt).toBe(11);expect(castAutoSkill(m,u,e)).toBe(false);expect(u.skillCharge).toBe(0);e.x+=200;advance(m,1.1);expect(e.hp).toBe(10000);
});
it.each([
 ['yuria','guardHp'],['mia','guardHp'],['leon','damageReductionUntil'],['neris','projectileGuardHits'],['livia','damageReductionUntil'],
] as const)('%s tank skill applies its defensive identity and dedicated animation', (id,field)=>{
 const {m,u,e}=fixture(id,3);u.skillCharge=100;
 expect(castAutoSkill(m,u,e)).toBe(true);
 expect((u[field]??0)).toBeGreaterThan(0);
 expect(m.effects.some(f=>f.life>0&&f.visual===`support-skill-${id}`)).toBe(true);
 expect(u.skillReadyAt).toBe(14);
});
it('tank guard absorbs damage before HP and Leon mitigation reduces the remainder',()=>{
 const {m,u}=fixture('leon');u.guardHp=10;u.damageReductionUntil=5;
 const hp=u.hp;m.hurtUnit(u,20);
 expect(u.guardHp).toBe(0);expect(u.hp).toBeCloseTo(hp-4.4);
 expect(m.effects.some(f=>f.visual==='tank-guard-hit-leon')).toBe(true);
});
it('all five tank-position operators fight in melee and keep their distinct defensive auto skills',()=>{
 for(const id of ['yuria','mia','leon','neris','livia']){
  expect(combatRoles[id].kind,id).toBe('melee');
  const {m,u,e}=fixture(id,3);attack(m,u,e);advance(m,.4);
  expect(e.hp,id).toBeLessThan(10000);
  expect(m.effects.some(f=>f.visual===`slash-${id}`),id).toBe(true);
  u.skillCharge=100;expect(castAutoSkill(m,u,e),id).toBe(true);
  expect(m.effects.some(f=>f.visual===`support-skill-${id}`),id).toBe(true);
 }
});
it('Luna meteor deals no damage or explosion sound until it reaches the magic circle',()=>{
 const {m,u,e}=fixture('luna');const sounds:string[]=[];m.onSound=s=>sounds.push(s);attack(m,u,e);
 advance(m,.8);expect(e.hp).toBe(10000);expect(sounds).not.toContain('explosion');
 advance(m,.2);expect(e.hp).toBeLessThan(10000);expect(sounds).toContain('explosion');
});
it('every hero has a real attack action and five documented star stages',()=>{
 expect(Object.keys(combatRoles).sort()).toEqual(heroes.map(h=>h.id).sort());
 for(const h of heroes){const {m,u,e}=fixture(h.id);attack(m,u,e);expect(m.actions.some(a=>a.active&&a.kind===combatRoles[h.id].kind)).toBe(true);advance(m,1.2);expect(e.hp,h.id).toBeLessThan(10000);expect(combatRoles[h.id].stages).toHaveLength(5);}
});
it('Leon alone receives a north pose correction shared with his weapon transform',()=>{
 expect(poseSize('leon',true)).toBe(96);expect(poseSize('sera',true)).toBe(132);const p=weaponPoint('leon',{x:400,y:400},true,false,1);expect(Number.isFinite(p.x+p.y)).toBe(true);
});
it('DPS expires after ten seconds and damage categories add up to actual HP lost',()=>{
 const {m,u,e}=fixture('ian');attack(m,u,e);advance(m,1);const r=m.ranking()[0];expect(r.damage).toBeCloseTo(10000-e.hp);expect(Object.values(r.parts).reduce((a,b)=>a+b,0)).toBeCloseTo(r.damage);expect(r.dps).toBeGreaterThan(0);m.time+=11;expect(m.ranking()[0].dps).toBe(0);
});
