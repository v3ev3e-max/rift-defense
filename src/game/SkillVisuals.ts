import type {Unit} from '../entities/HeroUnit';

export type HeroAuraKind='skill'|'heal'|'haste'|'offense'|'guard';
export interface HeroAura {kind:HeroAuraKind;color:number;strength:number}

/** Visual-only projection of persistent combat state. Keeping this separate from
 * the renderer makes every timed buff visible without changing its balance. */
export function heroAuras(u:Unit,time:number,heroColor:number):HeroAura[]{
 const result:HeroAura[]=[];
 if((u.skillEffectUntil??0)>time)result.push({kind:'skill',color:heroColor,strength:1});
 if((u.supportRegenUntil??0)>time)result.push({kind:'heal',color:0x61f2a6,strength:.9});
 if((u.supportSpeedUntil??0)>time||(u.supportChargeUntil??0)>time)result.push({kind:'haste',color:0x69ddff,strength:.85});
 if((u.supportAttackUntil??0)>time||(u.supportCritUntil??0)>time)result.push({kind:'offense',color:0xff9d61,strength:.9});
 if((u.damageReductionUntil??0)>time||(u.projectileGuardUntil??0)>time||(u.tankBlockUntil??0)>time||(u.guardHp??0)>0)result.push({kind:'guard',color:0x9ca8ff,strength:.85});
 return result;
}
