/** Authored preparation/contact/recovery poses, never movement-frame copies. */
import {authoredFrameAt} from './AuthoredFrames';
export const originMonsterActions:Record<string,number>={
 crystal_bastion:13,tide_skimmer:13,prism_cannon:13,coral_singer:13,
 lunar_husk:14,spore_leaper:14,moon_ray:14,bloom_keeper:14,
 stellar_plate:15,plasma_hound:15,nova_turret:15,forge_conductor:15,
 origin_warden:16,causal_blade:16,genesis_eye:16,fate_weaver:16,
};

/** Finite event playback. A future event or an expired event has no pose. */
export function monsterActionFrame(now:number,started:number|undefined,duration:number,count:number){
 if(started===undefined)return 0;
 const elapsed=now-started;
 return elapsed>=0&&elapsed<duration?1+authoredFrameAt(elapsed,duration,count):0;
}
