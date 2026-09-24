// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {existsSync,readFileSync,statSync} from 'node:fs';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {createHash} from 'node:crypto';
import {describe,expect,it} from 'vitest';
import {campaignEnemyIds,campaignRegion,campaignStages} from '../src/data/campaign';
import {enemies} from '../src/data/enemies';
import {enemyMoveFrameCount} from '../src/game/EnemyMotion';

const regional:Record<number,Set<string>>={
  1:new Set(['crawler']),2:new Set(['crawler','runner']),3:new Set(['crawler','runner','sprinter']),
  4:new Set(['armored','brute','crawler','ravager','sprinter']),5:new Set(['armored','crawler','jammer']),
  6:new Set(['armored','brute','jammer','runner']),7:new Set(['bulwark','jammer','phantom','sprinter']),
  8:new Set(['abyssal','armored','bulwark','elite','jammer','phantom']),
  9:new Set(['sky_guard','sky_lancer','cloud_gunner','aether_mender','named_sky','storm_wyvern','sky_dominion']),
  10:new Set(['relic_golem','dune_ripper','sun_archer','mirage_oracle','named_dune','sand_colossus','solar_sphinx']),
  11:new Set(['alloy_guard','gear_hound','pulse_turret','repair_weaver','named_machine','forge_overseer','machine_god']),
  12:new Set(['paradox_shell','chrono_stalker','epoch_caster','time_mender','named_time','chrono_reaper','aeon_sovereign']),
};
const asset=(path:string)=>`public${path}`;
const present=(path:string)=>existsSync(asset(path))&&statSync(asset(path)).size>0;

describe('campaign enemy assets',()=>{
  it('resolves every enemy injected by all 120 stage wave generators',()=>{
    for(const stage of campaignStages)for(const id of campaignEnemyIds(stage))expect(enemies[id],`${stage.id}: ${id}`).toBeDefined();
  });

  it('has a complete static and movement fallback for every spawned enemy',()=>{
    for(const stage of campaignStages){
      const area=campaignRegion(stage),visualArea=area>12?area-4:area,folder=`/assets/generated/campaign-enemies/map-${String(visualArea).padStart(2,'0')}`;
      for(const id of campaignEnemyIds(stage)){
        const def=enemies[id],visual=def.visualId??id,isRegional=!!regional[visualArea]?.has(visual);
        const still=isRegional&&visual!=='elite'?`${folder}/${visual}.webp`:`/assets/generated/enemies/${visual}.webp`;
        expect(present(still),`${stage.id}: ${id} static ${still}`).toBe(true);
        for(let frame=1;frame<=enemyMoveFrameCount(!!def.boss,isRegional);frame++){
          const suffix=String(frame).padStart(2,'0');
          const move=isRegional&&visual!=='elite'?`${folder}/${visual}/move/move_${suffix}.webp`:`/assets/generated/enemy-motion/${visual}/move_${suffix}.webp`;
          expect(present(move),`${stage.id}: ${id} movement ${move}`).toBe(true);
        }
      }
    }
  });

  it('has regional movement effects for every campaign area',()=>{
    for(let area=1;area<=12;area++)for(const [kind,count] of [['step',4],['projectile',3],['impact',3]] as const)
      for(let frame=1;frame<=count;frame++)expect(present(`/assets/generated/campaign-enemies/map-${String(area).padStart(2,'0')}/fx/${kind}/frame_${String(frame).padStart(2,'0')}.webp`),`map ${area} ${kind} ${frame}`).toBe(true);
  });

  it('ships six distinct generated attack frames for the first authored melee enemy',()=>{
    const hashes=[];
    for(let frame=1;frame<=6;frame++){
      const path=`public/assets/generated/campaign-enemies/map-04/brute/attack/frame_${String(frame).padStart(2,'0')}.png`;
      expect(present(path.slice('public'.length)),`brute attack ${frame}`).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(100_000);
      hashes.push(createHash('sha256').update(readFileSync(path)).digest('hex'));
    }
    expect(new Set(hashes).size).toBe(6);
  });
});
