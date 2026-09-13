import type {BattleModel} from './BattleModel';
import type {Unit} from '../entities/HeroUnit';
import type {Enemy} from '../entities/Enemy';
import type {Element} from '../data/types';
import {addZone} from './ActionCombat';
export const tripleNames:Record<number,string>={13:'공허 폭풍',14:'재앙 과부하',7:'플라즈마 증기',11:'심연 온천'};
const bits={water:1,fire:2,electric:4,dark:8};
export function advanceTriple(m:BattleModel,u:Unit,e:Enemy,first:Element,second:Element,power:number){
 const cell=Math.min(3,Math.max(0,Math.floor(e.x/200)))+4*Math.min(3,Math.max(0,Math.floor(e.y/200)));
 const meter=m.tripleMeters[cell];if(m.time-meter.last>8){meter.mask=0;meter.count=0;}meter.last=m.time;
 meter.mask|=bits[first]|bits[second];meter.count=Math.min(6,meter.count+1);
 const key=[13,14,7,11].find(key=>(meter.mask&key)===key);if(!key||meter.count<6)return;
 meter.mask=0;meter.count=0;const name=tripleNames[key];m.tripleCounts[name]=(m.tripleCounts[name]??0)+1;m.lastReaction=name;e.reactionKind=name;e.reactionTime=.8;
 const r=m.records.find(r=>r.uid===u.uid);if(r)r.tripleReactions++;
 m.say(`${name} · 지역 반응 6회 완성`);
 m.emit('blast',e.x,e.y,e.x,e.y,key===13?0xaa77ff:key===14?0xff6655:0x7fffff,{visual:key===13?'arc-void':key===14?'reaction-overload':'reaction-corrosion',radius:150,duration:.8});
 if(key===14){for(const v of m.enemies)if(v.active&&Math.hypot(v.x-e.x,v.y-e.y)<150){v.doomOwner=u.uid;v.doomPower=power*.7;}return;}
 addZone(m,u,e.x,e.y,150,key===13?'storm':key===7?'plasma':'abyss',power*.3);
}
