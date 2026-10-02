import type {Unit} from '../entities/HeroUnit';
export function expireShield(unit:Unit,now:number){
 if(unit.guardUntil!==undefined&&now>=unit.guardUntil){unit.guardHp=0;unit.guardUntil=undefined;}
}
/** Refresh the strongest shield; weaker basic assistance cannot extend it. */
export function grantShield(unit:Unit,amount:number,now:number,duration:number){
 expireShield(unit,now);
 const shield=Math.min(unit.maxHp*.65,Math.max(0,amount));
 if(shield>=(unit.guardHp??0)){unit.guardHp=shield;unit.guardUntil=now+duration;}
}
export function finalizeCastShields(units:Unit[],before:Map<number,number>,now:number,duration:number){
 for(const unit of units){
  const previous=before.get(unit.uid)??0,increase=(unit.guardHp??0)-previous;
  if(increase<=0)continue;
  unit.guardHp=previous;grantShield(unit,increase,now,duration);
 }
}
