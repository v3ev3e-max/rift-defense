/** One shared routing table for rendering and full-roster regression tests. */
export const regionalEnemyArt:Record<number,Set<string>>={
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
 13:new Set(['crystal_bastion','tide_skimmer','prism_cannon','coral_singer']),
 14:new Set(['lunar_husk','spore_leaper','moon_ray','bloom_keeper']),
 15:new Set(['stellar_plate','plasma_hound','nova_turret','forge_conductor']),
 16:new Set(['origin_warden','causal_blade','genesis_eye','fate_weaver']),
};
export function enemyVisualContext(def:{id:string;visualId?:string},area:number,inCampaign:boolean){
 const visualId=def.visualId??def.id,artArea=area>12&&def.visualId?area-4:area;
 return {visualId,artArea,regional:!!(area>0&&inCampaign&&regionalEnemyArt[artArea]?.has(visualId))};
}
