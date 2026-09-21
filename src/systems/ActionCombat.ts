import type {BattleModel} from './BattleModel';
import type {Unit} from '../entities/HeroUnit';
import type {Enemy} from '../entities/Enemy';
import {heroById} from '../data/heroes';
import {enemies} from '../data/enemies';
import {combatRoles,formationRole, type AttackKind} from '../data/combatRoles';
import {weaponPoint,dronePoint} from '../game/WeaponSockets';
import {charge} from './AutoSkills';
import {activeLinks} from '../data/strategy';
import {applyElementHit} from './ElementSystem';
import type {Element} from '../data/types';
import type {DamageKind} from './CombatLedger';
import {MAP} from '../data/map';
import {equipmentBonus} from '../data/equipment';
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
export const SNIPER_ROUND_SPEED=1050;
function rayToMapEdge(x:number,y:number,dx:number,dy:number){
 const times=[dx>0?(MAP.width-x)/dx:dx<0?(0-x)/dx:Infinity,dy>0?(MAP.height-y)/dy:dy<0?(0-y)/dy:Infinity].filter(t=>t>0&&Number.isFinite(t));
 const t=Math.min(...times);return {x:x+dx*t,y:y+dy*t,distance:Math.hypot(dx*t,dy*t)};
}
export interface CombatAction {reactionOnly?:boolean;sniperImpact?:boolean;active:boolean;chainHop:boolean;visited:number[];source:Unit|null;element:Element;kind:AttackKind;owner:number;target:number;generation:number;x:number;y:number;tx:number;ty:number;dirX:number;dirY:number;age:number;delay:number;duration:number;power:number;radius:number;count:number;skill:boolean;crit:boolean;hit:boolean}
export interface CombatZone {active:boolean;kind:'water'|'ice'|'corrosion'|'barrier'|'blackflame'|'storm'|'plasma'|'abyss';owner:number;x:number;y:number;radius:number;life:number;tick:number;power:number}
export const blankAction=():CombatAction=>({reactionOnly:false,sniperImpact:false,active:false,chainHop:false,visited:[],source:null,element:'fire',kind:'burst',owner:0,target:-1,generation:0,x:0,y:0,tx:0,ty:0,dirX:0,dirY:0,age:0,delay:0,duration:.3,power:0,radius:0,count:1,skill:false,crit:false,hit:false});
const signatureQuotes:Record<string,string>={
 yuria:'모두 제 뒤로. 방벽을 전개합니다!',reina:'시야 확보. 탄막을 개시한다!',sera:'트리거 해제. 전부 쓸어버릴게요!',noel:'사선 고정. 한 발이면 충분해.',arin:'레일 출력 최대. 관통합니다!',karin:'도망쳐도 소용없어. 베어낸다!',
};
/** Short Korean names rendered above the SD character during a skill cast. */
export const skillCalloutNames:Record<string,string>={
 yuria:'수호의 파도',reina:'진홍 탄막',arin:'황금 창',karin:'진홍 칼날',sera:'한계 돌파',noel:'지평선 파괴',
 luna:'초신성',mia:'나노 연결',ian:'다이달로스 편대',leon:'공명 섬광',adela:'전격 연쇄',neris:'수류장',
 belka:'점화 폭발',serin:'야상곡 저주',kyle:'과충전 연결',livia:'절대 해일',kairon:'지옥불 폭발',theria:'폭풍 왕관',
 noxia:'사건의 지평선',aurora:'이온 오로라',arden:'검은 태양',hana:'해일 방벽',zion:'적색 조준',gaia:'전격 방패',
 elise:'백색 궤적',vera:'밤의 화살',astra:'암흑 성채',solara:'태양 배열',celestia:'종말의 창',rhea:'생명 개화',
 echo:'박자 연결',meriel:'잿불 성가',selene:'월식 찬가',ophilia:'천공 성역',
};
export function skillDurationSeconds(heroId:string,star=1){
 if(combatRoles[heroId].kind==='support')return heroId==='echo'?4+star*.25:heroId==='ophilia'?4+star*.3:3.5+star*.25;
 if(formationRole(heroId)==='tank')return heroId==='yuria'?5+star*.35:heroId==='mia'?4:heroId==='leon'?5+star*.4:heroId==='neris'||heroId==='livia'?5+star*.5:heroId==='hana'?4.5+star*.4:heroId==='gaia'?5:6+star*.4;
 return .8;
}
function announceSkill(m:BattleModel,u:Unit){
 const h=heroById[u.heroId],callout=skillCalloutNames[u.heroId]??'필살기',quote=signatureQuotes[u.heroId]??`${callout} 전개. 목표를 제압합니다!`;
 u.skillCallout=callout;u.skillCalloutAt=m.time;
 m.say(`${h.name} · “${quote}”`);
 const role=formationRole(u.heroId),kind=combatRoles[u.heroId].kind;
 m.onSound?.(role==='tank'?'skill-guard':kind==='support'?'skill-support':kind==='sniper'?'skill-sniper':'skill-impact');
}
function animateSupport(u:Unit,target?:{x:number;y:number},time=0){
 u.shots++;u.lastAttackAt=time;
 if(!target)return;
 const dx=target.x-u.x,dy=target.y-u.y;
 u.facingUp=Math.abs(dy)>Math.abs(dx)&&dy<0;
 u.facingLeft=!u.facingUp&&dx<0;
}
export const blankZone=():CombatZone=>({active:false,kind:'water',owner:0,x:0,y:0,radius:0,life:0,tick:0,power:0});
export function addZone(m:BattleModel,u:Unit,x:number,y:number,radius:number,kind:CombatZone['kind'],power=0){
 const z=m.zones.find(z=>z.active&&z.owner===u.uid&&dist(z,{x,y})<radius*.5)??m.zones.find(z=>!z.active);
 if(z)Object.assign(z,{active:true,owner:u.uid,x,y,radius,kind,life:2.2+u.star*.35+(u.branch==='tempo'?1:0)+(u.ultimate==='tempo'?2:0),tick:.4,power});
}
export function reactionShot(m:BattleModel,u:Unit,origin:{x:number;y:number},e:Enemy,power:number,delay:number,element:Element){
 const a=m.actions.find(a=>!a.active);if(!a)return;
 Object.assign(a,{...blankAction(),active:true,reactionOnly:true,source:{...u},element,kind:'chain',owner:u.uid,target:e.index,generation:e.generation??0,x:origin.x,y:origin.y,tx:e.x,ty:e.y,power,delay,duration:.08});
}
function face(m:BattleModel,u:Unit,p:{x:number;y:number}){u.lastAttackAt=m.time;u.facingUp=p.y<u.y-8&&u.y-p.y>Math.abs(p.x-u.x)*.7;if(Math.abs(p.x-u.x)>2)u.facingLeft=p.x<u.x;}
export function queue(m:BattleModel,u:Unit,e:Enemy,power:number,kind:AttackKind,delay=0,skill=false,point=e){
 const a=m.actions.find(a=>!a.active);if(!a)return false;
 const origin=kind==='drone'?dronePoint(u,m.time):weaponPoint(u.heroId,u,!!u.facingUp,!!u.facingLeft,1);
 const duration=kind==='sniper'?Math.max(.5,.95-u.star*.07):kind==='meteor'?.95:kind==='shell'?.65:kind==='drone'?Math.max(.45,.8-u.star*.04):kind==='melee'?.16:kind==='water'?.48:.14;
 const destination={x:point.x,y:point.y};
 Object.assign(a,{...blankAction(),active:true,source:{...u},element:(heroById[u.heroId].secondaryElement&&u.shots%2===0?heroById[u.heroId].secondaryElement:heroById[u.heroId].element),kind,owner:u.uid,target:e.index,generation:e.generation??0,x:origin.x,y:origin.y,tx:destination.x,ty:destination.y,dirX:destination.x-u.x,dirY:destination.y-u.y,delay,skill,duration,power,radius:kind==='melee'?m.stats(u).range:kind==='water'?65+u.star*8:55+u.star*10,crit:m.rng()<m.stats(u).crit,count:u.star});if(u.branch==='spread'||u.ultimate==='spread')a.radius*=u.star>=5?1.55:u.star>=4?1.4:1.3;return true;
}
export function attack(m:BattleModel,u:Unit,e:Enemy){
 face(m,u,e);u.shots++;
 if(u.heroId==='mia'&&u.shots%6===0)for(const ally of m.units)if(ally!==u&&dist(ally,u)<m.stats(u).range){ally.stunned=0;ally.cooldown=0;}
 const kind=combatRoles[u.heroId].kind,s=m.stats(u);
 const continuous=u.lockTarget===e.generation&&m.time-(u.lockAt??-99)<2;
 u.heat=continuous?Math.min(8,(u.heat??0)+1):0;u.lockTarget=e.generation;u.lockAt=m.time;
 if(kind==='burst'){
  const count=u.star>=5?8:u.star>=2?5:3;
  for(let i=0;i<count;i++)queue(m,u,e,s.atk/count*(1+(u.star>=4?(u.heat??0)*.035:0)),kind,i*.075);
 }else if(kind==='drone'){
  const count=(u.star>=5?4:u.star>=3?2:1)+(u.branch==='spread'?1:0);
  for(let i=0;i<count;i++)queue(m,u,e,s.atk*(.85+i*.12)*(u.heroId==='ian'?1.15:1),kind,i*.13);u.droneShots++;
 }else if(kind==='melee'&&u.heroId==='karin'){
  const count=u.star===5?5:2;for(let i=0;i<count;i++)queue(m,u,e,s.atk/count,kind,i*.09);
 }else{
  queue(m,u,e,s.atk,kind);
  if(kind==='meteor'&&u.star>=4)queue(m,u,e,s.atk*.5,kind,.25);
 }
 if(u.branch==='spread'&&kind==='burst'){const others=m.enemies.filter(v=>v.active&&v!==e&&dist(v,u)<s.range*.75).slice(0,u.star>=5?4:2);for(const v of others)queue(m,u,v,s.atk*.3,kind,.12);}
 if(u.ultimate==='spread'){const other=m.enemies.find(v=>v.active&&v!==e&&dist(v,u)<=s.range);if(other)queue(m,u,other,s.atk*.6,kind,.3);}
 if(u.ultimate==='focus')queue(m,u,e,s.atk*.45,kind,.24);
 for(const ally of m.units)if(ally!==u&&combatRoles[ally.heroId].kind==='support'&&dist(ally,u)<m.stats(ally).range)charge(ally,3,m.time);
 triggerLink(m,u,e,'attack');
 if(m.builds.drone&&kind!=='drone')queue(m,u,e,s.atk*.18*m.builds.drone,'drone');
 if(kind!=='sniper'&&kind!=='meteor'&&kind!=='burst')m.onSound?.(kind==='melee'?'melee':kind==='drone'?'drone':kind==='shell'?'explosion':kind==='chain'||kind==='water'||kind==='curse'||kind==='support'?'laser':'attack');
}
function hit(m:BattleModel,u:Unit,e:Enemy,power:number,kind:DamageKind,crit=false){
 if(!e.active)return;
 const elementLevel=m.elementUpgrades[heroById[u.heroId].element];
 const ignore=Math.min(.95,(['noel','arin','zion','elise','vera','celestia'].includes(u.heroId)?(u.star>=4?.9:.7):0)+(heroById[u.heroId].element==='dark'&&elementLevel>=3?.12:0));
 power*=u.branch==='focus'?(enemies[e.kind].boss||e.kind==='elite'?(u.star>=4?1.85:1.65):e.hp/e.maxHp<.3?1.4:1):1;
 if(heroById[u.heroId].element==='water'&&elementLevel>=3&&e.slowTime>0)power*=1.12;
 if(heroById[u.heroId].element==='fire'&&elementLevel>=4&&(enemies[e.kind].boss||e.kind==='elite'))power*=1.15;
 if(heroById[u.heroId].element==='dark'&&elementLevel>=4&&e.vulnerabilityTime>0)power*=1.18;
 const magical=['chain','meteor','water','curse'].includes(combatRoles[u.heroId].kind);
 if(e.kind==='armored'&&!magical)power*=.65;
 if(e.kind==='phantom'&&magical)power*=.55;
 if(e.kind==='bulwark'&&(e.shieldHits??0)<6){e.shieldHits=(e.shieldHits??0)+1;return;}
 if(m.enemies.some(v=>v.active&&v.kind==='bulwark'&&v!==e&&dist(v,e)<120))power*=.8;
 const execution=['noxia','arden','serin'].includes(u.heroId)&&u.star>=2&&e.hp/e.maxHp<(heroById[u.heroId].element==='dark'&&elementLevel>=5?.35:.3)?1.25+(u.star>=4?.25:0):1;
 // A multi-hit combo pays one armor check in total. Otherwise Karin's listed
 // attack was split first and then reduced by armor two or five separate times.
 const armorSlices=u.heroId==='karin'&&kind==='basic'?(u.star>=5?5:2):1;
 const value=Math.max(1,power*execution-e.armor*(1-e.armorBreak)*(1-ignore)/armorSlices)*(crit?2+m.builds.crit*.18:1);
 const previous=m.damageKind;m.damageKind=kind;
 m.damage(e,value,u,true,crit);
 if(crit&&m.bonuses.bullet){const old=m.damageKind;m.damageKind='chain';m.damage(e,value*.7,u,true);m.damageKind=old;}
 if(kind==='basic'||kind==='drone'||kind==='chain')charge(u,combatRoles[u.heroId].kind==='sniper'?(enemies[e.kind].boss?20:14):kind==='drone'?10:4,m.time);
 if(heroById[u.heroId].element==='water'||u.heroId==='yuria')e.controlOwner=u.uid;
 if(u.branch==='element'){const element=heroById[u.heroId].element;e.dotOwner=u.uid;e.dotPower=Math.max(e.dotPower,value*.6);if(element==='fire'){e.burn=Math.max(e.burn,u.star>=4?3:2);e.burnTime=3;}else if(element==='water'){e.slow=Math.max(e.slow,.45);e.slowTime=3;e.controlOwner=u.uid;}else if(element==='dark'){e.bleed=Math.max(e.bleed,u.star>=4?3:2);e.bleedTime=3;}else e.electricMark=Math.max(e.electricMark,2);}
 if(u.ultimate==='element'&&kind!=='dot'&&kind!=='skill')addZone(m,u,e.x,e.y,80,heroById[u.heroId].element==='water'?'ice':heroById[u.heroId].element==='dark'?'corrosion':heroById[u.heroId].element==='electric'?'storm':'blackflame',value*.12);
 if(m.builds.blast)for(const other of m.enemies)if(other.active&&other!==e&&dist(other,e)<65)m.damage(other,value*.06*m.builds.blast,u,true);
 if(m.builds.shock&&heroById[u.heroId].element==='electric'){const next=m.enemies.find(other=>other.active&&other!==e&&dist(other,e)<170);if(next)m.damage(next,value*.08*m.builds.shock,u,true);}if(e.active)applyElementHit(m,u,e,m.campaign&&kind==='skill'?Math.min(value,m.stats(u).atk):value,m.attackElement);
 const gear=equipmentBonus(m.save,u.heroId),bonusElement=gear.element;
 if(e.active&&bonusElement&&bonusElement!==(m.attackElement??heroById[u.heroId].element)){
  applyElementHit(m,u,e,value*gear.elementDamage,bonusElement);
  if(bonusElement==='water'){e.slow=Math.max(e.slow,.12);e.slowTime=Math.max(e.slowTime,.7);e.controlOwner=u.uid;}
  else if(bonusElement==='fire'){e.burn=Math.max(e.burn,1);e.burnTime=Math.max(e.burnTime,1.2);e.dotOwner=u.uid;e.dotPower=Math.max(e.dotPower,value*.2);}
  else if(bonusElement==='electric'&&m.rng()<.12){const next=m.enemies.find(v=>v.active&&v!==e&&dist(v,e)<130);if(next){const old=m.damageKind;m.damageKind='chain';m.damage(next,value*gear.elementDamage*.55,u,true);m.damageKind=old;m.emit('shot',e.x,e.y,next.x,next.y,0xffef83,{visual:'transfer-electric',duration:.2});}}
  else if(bonusElement==='dark'){e.armorBreak=Math.max(e.armorBreak,.08);e.armorBreakTime=Math.max(e.armorBreakTime,1);}
 }
 if(u.heroId==='karin'){e.bleed=Math.min(12,e.bleed+1);e.bleedTime=4;e.dotPower=Math.max(e.dotPower,value*.75);e.dotOwner=u.uid;}
 m.damageKind=previous;
}
export function chainStrike(m:BattleModel,u:Unit,start:Enemy,power:number,count:number,voidArc=false,visited:number[]=[],skill=false){
 const seen=[...visited,start.generation??start.index];
 hit(m,u,start,power,skill?'skill':'chain');
 if(count<=1)return;
 const radius=(start.waterMark?230:150)+(u.star>=2?25:0);
 const next=m.enemies.filter(e=>e.active&&!seen.includes(e.generation??e.index)&&dist(e,start)<radius).sort((a,b)=>dist(a,start)-dist(b,start))[0];
 const a=m.actions.find(a=>!a.active);if(!next||!a)return;
 Object.assign(a,{...blankAction(),active:true,chainHop:true,visited:seen,source:{...u},element:m.attackElement??heroById[u.heroId].element,kind:'chain',owner:u.uid,target:next.index,generation:next.generation??0,x:start.x,y:start.y,tx:next.x,ty:next.y,duration:.08,power:power*(u.star>=4?.94:.86),count:count-1,skill});
}
function resolve(m:BattleModel,a:CombatAction,u:Unit){
 let target=m.enemies[a.target];
 const savedElement=m.attackElement;m.attackElement=a.element;
 try {
 const valid=target?.active&&target.generation===a.generation;
 if(a.reactionOnly){if(valid){const old=m.damageKind;m.damageKind="reaction";m.damage(target,a.power,u,true);m.damageKind=old;m.emit("shot",a.x,a.y,target.x,target.y,a.element==="dark"?0xb995ff:0x7be9ff,{visual:`transfer-${a.element}`,duration:.3});}return;}
 const type:DamageKind=a.skill?'skill':a.kind==='drone'?'drone':'basic';
 const h=heroById[u.heroId],color=parseInt(h.color.slice(1),16);
 if(a.sniperImpact){if(valid){hit(m,u,target,a.power,type,a.crit);m.emit('blast',target.x,target.y,target.x,target.y,color,{visual:`${u.heroId}-impact`,duration:.35});}return;}
 if(valid&&a.kind==='chain'&&!a.chainHop&&u.heroId==='adela'&&m.units.some(v=>v.heroId==='neris')&&m.zones.some(z=>z.active&&z.kind==='water'&&dist(z,target)<z.radius)){const name='전도 발전소';m.linkCounts[name]=(m.linkCounts[name]??0)+1;const r=m.records.find(r=>r.uid===u.uid);if(r)r.linkCasts++;}
 if(a.kind==='sniper'){
  if(!valid)return;
  if(!a.skill){a.tx=target.x;a.ty=target.y;}
  const lockedDirection=a.dirX!==0||a.dirY!==0;
  const dx=lockedDirection?a.dirX:a.tx-a.x,dy=lockedDirection?a.dirY:a.ty-a.y,len=Math.hypot(dx,dy)||1;
  const edge=rayToMapEdge(a.x,a.y,dx,dy);
  const lineX=a.source?.x??a.x,lineY=a.source?.y??a.y;
  const victims=m.enemies.filter(e=>{const projection=((e.x-lineX)*dx+(e.y-lineY)*dy)/len;return e.active&&projection>=0&&projection<=edge.distance&&Math.abs((e.x-lineX)*dy-(e.y-lineY)*dx)/len<24;}).sort((x,y)=>((x.x-lineX)*dx+(x.y-lineY)*dy)-((y.x-lineX)*dx+(y.y-lineY)*dy)).slice(0,3);
  const flight=Math.max(.22,edge.distance/SNIPER_ROUND_SPEED);
  m.onSound?.('sniper');
  m.emit('blast',a.x,a.y,a.x,a.y,color,{visual:'sniper-muzzle',duration:.18,radius:34});
  m.emit('shot',a.x,a.y,edge.x,edge.y,color,{visual:'sniper-round',duration:flight});
  for(const [pierceIndex,e] of victims.entries()){const impact=m.actions.find(v=>!v.active);if(!impact)break;const projection=((e.x-lineX)*dx+(e.y-lineY)*dy)/len;Object.assign(impact,{...blankAction(),active:true,sniperImpact:true,source:{...u},element:a.element,kind:'sniper',owner:u.uid,target:e.index,generation:e.generation??0,x:a.x,y:a.y,tx:e.x,ty:e.y,delay:Math.max(.015,projection/SNIPER_ROUND_SPEED),duration:.01,power:a.power*(m.campaign?Math.pow(.8,pierceIndex):1)*(enemies[e.kind].boss?(u.heroId==='noel'?1.45:u.heroId==='celestia'?1.32:1):1),skill:a.skill,crit:a.crit});}
 }else if(a.kind==='chain'){
  if(!valid)return;
   m.emit('shot',a.x,a.y,target.x,target.y,color,{visual:`transfer-${a.element}`,duration:.25});
  chainStrike(m,u,target,a.power,a.chainHop?a.count:Math.min(8,2+Number(u.heroId==='theria')+(u.heroId==='aurora'?3:0)+(u.branch==='spread'?2:0)+(u.heroId==='adela'&&m.units.some(v=>v.heroId==='neris')&&m.zones.some(z=>z.active&&z.kind==='water'&&dist(z,target)<z.radius)?2:0)+(u.star>=3?2:0)+(u.star>=5?2:0)+Number(target.waterMark>0)),false,a.visited,a.skill);
 }else if(a.kind==='melee'){
  const dx=a.tx-u.x,dy=a.ty-u.y,len=Math.hypot(dx,dy)||1;
  for(const e of m.enemies)if(e.active&&dist(e,u)<=a.radius&&((e.x-u.x)*dx+(e.y-u.y)*dy)/((dist(e,u)||1)*len)>.35){
   hit(m,u,e,a.power,type,a.crit);
   if(u.heroId==='yuria'){
    const slow=Math.min(.47,.22+m.stats(u).e.slow*.5+m.builds.water*.02+m.elementUpgrades.water*.012);
    e.slow=Math.max(e.slow,slow);e.slowTime=Math.max(e.slowTime,.75+u.star*.08);
   }
  }
  m.emit('blast',u.x,u.y,a.tx,a.ty,color,{visual:'slash-'+u.heroId,duration:.3,radius:a.radius});
 }else if(['meteor','shell','water'].includes(a.kind)){
  for(const e of m.enemies)if(e.active&&dist(e,{x:a.tx,y:a.ty})<=a.radius)hit(m,u,e,a.power,type,a.crit);
  if(a.kind==='meteor')m.onSound?.('explosion');
  m.emit('blast',a.tx,a.ty,a.tx,a.ty,color,{visual:a.kind==='meteor'?'luna-meteor-impact':`${u.heroId}-skill`,duration:a.kind==='meteor'?.72:.6});
  if(a.kind==='meteor')triggerLink(m,u,target,'meteor',{x:a.tx,y:a.ty});
  if(u.ultimate==='spread')addZone(m,u,a.tx,a.ty,a.radius,'plasma',a.power*.2);
  if(a.kind==='water')addZone(m,u,a.tx,a.ty,a.radius,u.heroId==='livia'?'ice':'water',a.power*.1);
  if(a.kind==='shell'&&u.star>=3)for(const e of m.enemies)if(e.active&&e.burn&&dist(e,{x:a.tx,y:a.ty})<=a.radius*1.5){hit(m,u,e,a.power*.25,'chain');m.emit('blast',e.x,e.y,e.x,e.y,color,{visual:`${u.heroId}-impact`});}
 }else if(a.kind==='drone'){
  if(!valid)return;
  a.tx=target.x;a.ty=target.y;
  hit(m,u,target,a.power,type,a.crit);triggerLink(m,u,target,'drone');
  m.emit('blast',a.tx,a.ty,a.tx,a.ty,color,{visual:u.star>=4?'drone-overcharge':'drone-impact',duration:.4});
  if(u.heroId==='mia'){target.slow=.35;target.slowTime=2;for(const ally of m.units)if(dist(ally,u)<=m.stats(u).range){ally.stunned=Math.max(0,ally.stunned-1);ally.cooldown=Math.min(ally.cooldown,.04);}}
  if(u.heroId==='kyle'&&target.active)chainStrike(m,u,target,a.power*.3,2);
  if(u.heroId==='ian'&&u.star>=4)for(const e of m.enemies)if(e.active&&e!==target&&dist(e,target)<70)hit(m,u,e,a.power*.4,'drone');
 }else{
  if(a.skill&&a.kind==='burst'){const dx=a.tx-a.x,dy=a.ty-a.y,len=Math.hypot(dx,dy)||1;m.onSound?.('attack');m.emit('shot',a.x,a.y,a.x,a.y,color,{visual:`muzzle-flash-${u.heroId}`,duration:.2});for(const e of m.enemies)if(e.active&&dist(e,u)<=m.stats(u).range&&((e.x-a.x)*dx+(e.y-a.y)*dy)/((dist(e,a)||1)*len)>.9){hit(m,u,e,a.power,'skill',a.crit);m.emit('blast',e.x,e.y,e.x,e.y,color,{visual:`${u.heroId}-impact`,duration:.22});}return;}
  if(!valid)return;
  if(a.kind==='burst'){m.onSound?.('attack');m.emit('shot',a.x,a.y,a.x,a.y,color,{visual:`muzzle-flash-${u.heroId}`,duration:.25});}
  if(a.kind==='curse')m.emit('shot',a.x,a.y,target.x,target.y,color,{visual:`${u.heroId}-projectile`,duration:.2});
  hit(m,u,target,a.power,type,a.crit);
  m.emit('blast',target.x,target.y,target.x,target.y,color,{visual:`${u.heroId}-impact`,duration:.22});
  if(a.kind==='support'){target.slow=.2;target.slowTime=1.2;if(u.star>=3)for(const e of m.enemies)if(e.active&&dist(e,target)<a.radius){e.slow=.3;e.slowTime=1.5;}}
  if(a.kind==='curse'){target.vulnerability=.12+u.star*.02;target.vulnerabilityTime=3;if(u.star>=3)for(const e of m.enemies)if(e.active&&dist(e,target)<a.radius){e.vulnerability=Math.max(e.vulnerability,.12);e.vulnerabilityTime=3;}}
   if(u.star>=3&&a.kind==='burst'){
    const extra=m.enemies.find(e=>e.active&&e!==target&&dist(e,target)<45);if(extra){hit(m,u,extra,a.power*.4,'chain');m.emit('blast',extra.x,extra.y,extra.x,extra.y,color,{visual:`${u.heroId}-impact`,duration:.18});}
  }
 }
 }finally{m.attackElement=savedElement;}
}
export function stepActions(m:BattleModel,dt:number){
 for(const u of m.units){
  if(u.slot<0||u.hp<=0)continue;
  if((u.supportRegenUntil??0)>m.time){const healed=Math.min(u.maxHp-u.hp,u.maxHp*(u.supportRegenRate??0)*dt);u.hp+=healed;}
  if((u.supportChargeUntil??0)>m.time)charge(u,(u.supportChargeRate??0)*dt,m.time);
 }
 for(const a of m.actions){if(!a.active)continue;
  const u=m.units.find(u=>u.uid===a.owner)??a.source;if(!u||u.slot<0){a.active=false;continue;}
  a.age+=dt;if(a.age<a.delay)continue;
  const elapsed=a.age-a.delay;
  const target=m.enemies[a.target];
   if(!a.hit&&!a.skill&&['sniper','drone','chain','curse','support'].includes(a.kind)){
   if(!target?.active||target.generation!==a.generation){a.active=false;continue;}
   if(a.kind==='sniper'&&!a.sniperImpact&&dist(u,target)>m.stats(u).range){a.active=false;continue;}
   a.tx=target.x;a.ty=target.y;
  }
  if(!a.hit&&elapsed>=a.duration){a.hit=true;resolve(m,a,u);}
  if(elapsed>=a.duration+(a.kind==='drone'?.55:.12))a.active=false;
 }
 for(const z of m.zones){if(!z.active)continue;z.life-=dt;if(z.life<=0){z.active=false;continue;}z.tick-=dt;
  for(const e of m.enemies){if(!e.active||dist(e,z)>z.radius)continue;
   e.controlOwner=z.owner;
   const owner=m.units.find(u=>u.uid===z.owner)??m.retiredUnits.get(z.owner);
   const zoneSlow=z.kind==='barrier'?Math.min(.55,.39+(owner?.star??1)*.03):z.kind==='ice'?.55:.3;
   e.slow=Math.max(e.slow,zoneSlow);e.slowTime=Math.max(e.slowTime,.15);
   if(z.kind==='corrosion'){e.armorBreak=Math.max(e.armorBreak,.3);e.armorBreakTime=.5;}
   else if(z.kind!=='barrier'){e.waterMark=Math.max(1,e.waterMark);e.waterTime=Math.max(.5,e.waterTime);}
   if(z.kind==='blackflame'||z.kind==='abyss'){e.burn=Math.max(e.burn,2);e.burnTime=1;e.dotOwner=z.owner;e.dotPower=Math.max(e.dotPower,z.power);e.vulnerability=Math.max(e.vulnerability,.15);e.vulnerabilityTime=.6;}
   if(z.kind==='abyss'){e.armorBreak=Math.max(e.armorBreak,.4);e.armorBreakTime=.6;}
   if(z.tick<=0&&z.power){const u=m.units.find(u=>u.uid===z.owner)??m.retiredUnits.get(z.owner);if(u){if(z.kind==='storm')chainStrike(m,u,e,z.power,3,false,[],true);else if(z.kind==='plasma'){const old=m.damageKind;m.damageKind='reaction';m.damage(e,z.power,u,true);m.damageKind=old;}else hit(m,u,e,z.power,'skill');}}
  }if(z.tick<=0)z.tick=.5;
 }
}
export function castAutoSkill(m:BattleModel,u:Unit,target?:Enemy){
 if(m.paused||m.ended||(u.skillCharge??0)<100||m.time<(u.skillReadyAt??0))return false;
 const kind=combatRoles[u.heroId].kind;if(target)face(m,u,target);
 if(kind==='support'){
  announceSkill(m,u);
  const duration=skillDurationSeconds(u.heroId,u.star);
  const allies=m.units.filter(v=>v.slot>=0&&v.hp>0&&(u.heroId==='ophilia'||dist(v,u)<=m.stats(u).range));
  const visualTarget=[...allies].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  animateSupport(u,visualTarget,m.time);
  for(const ally of allies){
   ally.stunned=0;
   if(u.heroId==='rhea'){
    const healed=Math.min(ally.maxHp-ally.hp,ally.maxHp*(.08+u.star*.012));ally.hp+=healed;u.healingDone=(u.healingDone??0)+healed;
    ally.supportRegenRate=Math.max(ally.supportRegenRate??0,.008+u.star*.001);ally.supportRegenUntil=m.time+duration;ally.guardHp=(ally.guardHp??0)+ally.maxHp*.03;
   }else if(u.heroId==='echo'){
    ally.cooldown=Math.min(ally.cooldown,.12);charge(ally,5+u.star,m.time);ally.supportSpeedBonus=Math.max(ally.supportSpeedBonus??0,.1+u.star*.012);ally.supportSpeedUntil=m.time+duration;ally.supportChargeRate=Math.max(ally.supportChargeRate??0,1+u.star*.12);ally.supportChargeUntil=m.time+duration;
   }else if(u.heroId==='meriel'){
    ally.guardHp=(ally.guardHp??0)+ally.maxHp*(.06+u.star*.008);ally.damageReductionUntil=Math.max(ally.damageReductionUntil??0,m.time+Math.min(2.5,duration));ally.supportAttackBonus=Math.max(ally.supportAttackBonus??0,.08+u.star*.012);ally.supportAttackUntil=m.time+duration;
   }else if(u.heroId==='selene'){
    ally.supportAttackBonus=Math.max(ally.supportAttackBonus??0,.07+u.star*.012);ally.supportAttackUntil=m.time+duration;ally.supportCritBonus=Math.max(ally.supportCritBonus??0,.06+u.star*.01);ally.supportCritUntil=m.time+duration;ally.supportRegenRate=Math.max(ally.supportRegenRate??0,.004+u.star*.0008);ally.supportRegenUntil=m.time+duration;
   }else{
    const healed=Math.min(ally.maxHp-ally.hp,ally.maxHp*(.1+u.star*.015));ally.hp+=healed;u.healingDone=(u.healingDone??0)+healed;
    ally.guardHp=(ally.guardHp??0)+ally.maxHp*(.07+u.star*.008);ally.damageReductionUntil=Math.max(ally.damageReductionUntil??0,m.time+Math.min(3,duration));ally.supportRegenRate=Math.max(ally.supportRegenRate??0,.005+u.star*.001);ally.supportRegenUntil=m.time+duration;
   }
   m.emit('blast',u.x,u.y,ally.x,ally.y,parseInt(heroById[u.heroId].color.slice(1),16),{visual:`support-skill-${u.heroId}`,duration:.55,radius:52});
  }
  const r=m.records.find(r=>r.uid===u.uid);if(r)r.autoCasts++;const cooldown=u.heroId==='ophilia'?18:14;u.skillCharge=0;u.skillHeldAt=undefined;u.skillCooldownDuration=cooldown;u.skillReadyAt=m.time+cooldown;
  u.skillEffectDuration=duration;u.skillEffectUntil=m.time+duration;
  m.emit('blast',u.x,u.y,u.x,u.y,parseInt(heroById[u.heroId].color.slice(1),16),{visual:`support-skill-${u.heroId}`,duration:.9,radius:u.heroId==='ophilia'?170:135});return true;
 }
 if(formationRole(u.heroId)==='tank'){
  announceSkill(m,u);
  const nearby=m.units.filter(v=>v.slot>=0&&v.hp>0&&dist(v,u)<=m.stats(u).range);
  if(u.heroId==='yuria'){
   u.guardHp=(u.guardHp??0)+u.maxHp*(.28+u.star*.05);u.tauntUntil=m.time+5+u.star*.35;u.tankBlockUntil=m.time+5+u.star*.35;addZone(m,u,u.x,u.y,95,'barrier');
  }else if(u.heroId==='mia'){
   u.guardHp=(u.guardHp??0)+u.maxHp*(.2+u.star*.04);u.tauntUntil=m.time+4;
   for(const ally of nearby){const heal=Math.min(ally.maxHp-ally.hp,ally.maxHp*(.12+u.star*.025));ally.hp+=heal;u.healingDone=(u.healingDone??0)+heal;ally.guardHp=(ally.guardHp??0)+ally.maxHp*.08;}
  }else if(u.heroId==='leon'){
   u.tauntUntil=m.time+5+u.star*.4;u.guardHp=(u.guardHp??0)+u.maxHp*(.18+u.star*.04);
   for(const ally of m.units)if(ally.slot>=0&&ally.hp>0)ally.damageReductionUntil=Math.max(ally.damageReductionUntil??0,m.time+4+u.star*.3);
  }else if(u.heroId==='neris'){
   u.projectileGuardUntil=m.time+5+u.star*.5;u.projectileGuardHits=2+Math.ceil(u.star/2);u.guardHp=(u.guardHp??0)+u.maxHp*.18;addZone(m,u,u.x,u.y,125,'water');
  }else if(u.heroId==='livia'){
   u.damageReductionUntil=m.time+5+u.star*.5;u.guardHp=(u.guardHp??0)+u.maxHp*(.2+u.star*.04);addZone(m,u,u.x,u.y,140,'ice');
   for(const e of m.enemies)if(e.active&&dist(e,u)<=220+u.star*12){e.slow=Math.max(e.slow,.55);e.slowTime=Math.max(e.slowTime,1.4+u.star*.22);e.controlOwner=u.uid;}
  }else if(u.heroId==='hana'){
   u.projectileGuardUntil=m.time+4.5+u.star*.4;u.projectileGuardHits=2+Math.ceil(u.star/2);u.guardHp=(u.guardHp??0)+u.maxHp*(.2+u.star*.035);u.tauntUntil=m.time+4;addZone(m,u,u.x,u.y,112,'water');
  }else if(u.heroId==='gaia'){
   u.guardHp=(u.guardHp??0)+u.maxHp*(.22+u.star*.04);u.tauntUntil=m.time+5;u.tankBlockUntil=m.time+5;for(const e of m.enemies)if(e.active&&dist(e,u)<190){e.slow=Math.max(e.slow,.3);e.slowTime=Math.max(e.slowTime,1.2);e.electricMark=Math.max(e.electricMark,1);e.electricTime=Math.max(e.electricTime,3);}
  }else if(u.heroId==='astra'){
   u.tauntUntil=m.time+6+u.star*.4;u.tankBlockUntil=m.time+6;u.guardHp=(u.guardHp??0)+u.maxHp*(.3+u.star*.05);for(const ally of m.units)if(ally.slot>=0&&ally.hp>0)ally.damageReductionUntil=Math.max(ally.damageReductionUntil??0,m.time+5+u.star*.35);addZone(m,u,u.x,u.y,145,'abyss');
  }
  const r=m.records.find(r=>r.uid===u.uid);if(r)r.autoCasts++;
  u.skillCharge=0;u.skillHeldAt=undefined;u.skillCooldownDuration=14;u.skillReadyAt=m.time+14;
  u.skillEffectDuration=skillDurationSeconds(u.heroId,u.star);u.skillEffectUntil=m.time+u.skillEffectDuration;
  m.emit('blast',u.x,u.y,u.x,u.y,parseInt(heroById[u.heroId].color.slice(1),16),{visual:`support-skill-${u.heroId}`,duration:.9,radius:135});return true;
 }
 if(!target||!queue(m,u,target,m.stats(u).atk*(u.star===5?4.5:3),kind,0,true))return false;
 announceSkill(m,u);
 if(u.heroId==='yuria')addZone(m,u,target.x,target.y,90,'barrier');
 if(u.heroId==='mia')for(const ally of m.units)if(dist(ally,u)<m.stats(u).range){ally.stunned=0;ally.cooldown=0;}
 if(kind==='drone')for(let i=1;i<3;i++)queue(m,u,target,m.stats(u).atk,kind,i*.12,true);
 const r=m.records.find(r=>r.uid===u.uid);if(r)r.autoCasts++;
 const cooldown=kind==='sniper'?13:kind==='burst'?10:11;u.skillCharge=0;u.skillHeldAt=undefined;u.skillCooldownDuration=cooldown;u.skillReadyAt=m.time+cooldown;
 u.skillEffectDuration=skillDurationSeconds(u.heroId,u.star);u.skillEffectUntil=m.time+u.skillEffectDuration;
 m.emit('blast',u.x,u.y,target.x,target.y,parseInt(heroById[u.heroId].color.slice(1),16),{visual:u.heroId+'-skill',duration:.82,radius:110});return true;
}
/** Support operators replace enemy-facing basic attacks with ally assistance. */
export function supportBasic(m:BattleModel,u:Unit){
 const allies=m.units.filter(v=>v.slot>=0&&v.hp>0&&v!==u&&dist(v,u)<=m.stats(u).range);
 if(!allies.length)return false;
 const ordered=[...allies].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp),ally=ordered[0],power=.009+u.star*.002;
 animateSupport(u,ally,m.time);
 if(u.heroId==='rhea'||u.heroId==='ophilia'){
  for(const target of u.heroId==='ophilia'?ordered.slice(0,2):[ally]){const healed=Math.min(target.maxHp-target.hp,target.maxHp*power);target.hp+=healed;u.healingDone=(u.healingDone??0)+healed;}
 }
 if(u.heroId==='echo'){ally.supportSpeedBonus=Math.max(ally.supportSpeedBonus??0,.04+u.star*.006);ally.supportSpeedUntil=m.time+2;charge(ally,1+u.star*.2,m.time);}
 if(u.heroId==='meriel'){ally.guardHp=(ally.guardHp??0)+ally.maxHp*(.008+u.star*.0015);ally.supportAttackBonus=Math.max(ally.supportAttackBonus??0,.02+u.star*.004);ally.supportAttackUntil=m.time+2.2;}
 if(u.heroId==='selene'){ally.supportAttackBonus=Math.max(ally.supportAttackBonus??0,.025+u.star*.004);ally.supportAttackUntil=m.time+2.2;}
 if(u.heroId==='selene'){ally.supportCritBonus=Math.max(ally.supportCritBonus??0,.02+u.star*.004);ally.supportCritUntil=m.time+2.2;}
 charge(u,2.5+u.star*.35,m.time);
 m.emit('blast',u.x,u.y,ally.x,ally.y,parseInt(heroById[u.heroId].color.slice(1),16),{visual:`support-basic-${u.heroId}`,duration:.35,radius:34});
 return true;
}
function triggerLink(m:BattleModel,u:Unit,e:Enemy,event:string,point:{x:number;y:number}=e){
 if(m.time<(u.linkReadyAt??0))return;
 for(const link of activeLinks(m.units)){
 if(!link.ids.includes(u.heroId))continue;
 const partner=m.units.find(v=>v.heroId===link.ids.find(id=>id!==u.heroId))!;
 let triggered=false;
 if(event==='attack'&&link.ids[0]==='sera'&&(u.heat??0)>=4){face(m,partner,e);for(let i=0;i<3;i++)queue(m,partner,e,m.stats(partner).atk*.2,'burst',i*.1);triggered=true;}
 if(event==='attack'&&u.heroId==='noel'&&link.ids[0]==='noel'&&dist(partner,e)<=m.stats(partner).range){face(m,partner,e);queue(m,partner,e,m.stats(partner).atk*.6,'sniper');triggered=true;}
 if(event==='attack'&&u.heroId==='mia'&&link.ids[0]==='yuria'){partner.stunned=0;charge(partner,20,m.time);addZone(m,partner,partner.x,partner.y,m.stats(partner).range,'barrier');triggered=true;}
 if(event==='meteor'&&u.heroId==='luna'&&link.ids[0]==='luna'){addZone(m,u,point.x,point.y,110,'blackflame',m.stats(u).atk*.15);triggered=true;}
 if(event==='drone'&&link.ids[0]==='ian'&&e.active){chainStrike(m,u,e,m.stats(u).atk*.25,3);triggered=true;}
 if(triggered){u.linkReadyAt=m.time+4;m.linkCounts[link.name]=(m.linkCounts[link.name]??0)+1;const r=m.records.find(r=>r.uid===u.uid);if(r)r.linkCasts++;return;}
 }
}
