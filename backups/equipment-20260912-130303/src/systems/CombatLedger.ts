export type DamageKind='basic'|'skill'|'drone'|'dot'|'chain'|'reaction';
export interface CombatRecord {uid:number;heroId:string;star:number;kills:number;damage:number;reactions:number;autoCasts:number;linkCasts:number;tripleReactions:number;blockTime:number;slowTime:number;supportDamage:number;born:number;parts:Record<DamageKind,number>;buckets:{second:number;value:number}[]}
export function newRecord(uid:number,heroId:string,star:number,time:number):CombatRecord{return {uid,heroId,star,kills:0,damage:0,reactions:0,autoCasts:0,linkCasts:0,tripleReactions:0,blockTime:0,slowTime:0,supportDamage:0,born:time,parts:{basic:0,skill:0,drone:0,dot:0,chain:0,reaction:0},buckets:Array.from({length:11},()=>({second:-100,value:0}))};}
export function recentDps(r:CombatRecord,time:number){return r.buckets.reduce((sum,b)=>sum+(b.second>Math.floor(time)-10&&b.second<=time?b.value:0),0)/10;}
export function accumulateRecord(into:CombatRecord,from:CombatRecord){
 for(const key of ['damage','kills','reactions','autoCasts','linkCasts','tripleReactions','blockTime','slowTime','supportDamage'] as const)into[key]+=from[key];
 into.star=Math.max(into.star,from.star);into.born=Math.min(into.born,from.born);
 for(const key of Object.keys(into.parts) as DamageKind[])into.parts[key]+=from.parts[key];
 for(const b of from.buckets){const dest=into.buckets[((b.second%11)+11)%11];if(dest.second===b.second)dest.value+=b.value;else if(b.second>dest.second)Object.assign(dest,b);}
}
