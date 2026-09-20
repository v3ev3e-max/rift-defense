import {expect,it} from 'vitest';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {readFileSync,statSync} from 'node:fs';

const files=['attack','sniper','laser','melee','explosion','drone','summon','merge','level','boss','victory','defeat'];
const uniqueWavFiles=['relic','critical','core-hit','shield-block','skill-guard','skill-support','skill-sniper','skill-impact'];
const menuMusicFiles=['menu-maint','menu-formation','menu-recruit','battle-region-1','battle-region-2'];
it('ships every referenced Pixabay sound as a real MP3',()=>{
 for(const name of files){const path=`public/assets/audio/${name}.mp3`;expect(statSync(path).size,name).toBeGreaterThan(10_000);const head=readFileSync(path).subarray(0,3);const id3=head[0]===0x49&&head[1]===0x44&&head[2]===0x33;const mpeg=head[0]===0xff&&(head[1]&0xe0)===0xe0;expect(id3||mpeg,name).toBe(true);}
});

it('ships compact looping menu music and keeps shared menu routing on one track',()=>{
 for(const name of menuMusicFiles){const path=`public/assets/audio/${name}.ogg`;expect(statSync(path).size,name).toBeGreaterThan(100_000);expect(readFileSync(path).subarray(0,4).toString(),name).toBe('OggS');}
 const audio=readFileSync('src/utils/Audio.ts','utf8');
 for(const name of menuMusicFiles)expect(audio).toContain(`${name}.ogg`);
 expect(audio).toContain('this.musicKind===kind');
 const main=readFileSync('src/main.ts','utf8');
 expect(main).toContain("this.screen==='home'||this.screen==='hero'||this.screen==='inventory'");
 expect(main).toContain("this.audio.setMusic('formation')");
 expect(main).toContain("this.audio.setMusic('recruit')");
 expect(main).toContain("region%2===1?'battle1':'battle2'");
 expect(main).toContain("playingBattle?(region%2===1?'battle1':'battle2'):'formation'");
});

it('ships distinct event and role skill effects instead of reusing generic samples',()=>{
 for(const name of uniqueWavFiles){const path=`public/assets/audio/${name}.wav`;expect(statSync(path).size,name).toBeGreaterThan(10_000);expect(readFileSync(path).subarray(0,4).toString(),name).toBe('RIFF');}
 const audio=readFileSync('src/utils/Audio.ts','utf8');
 for(const name of uniqueWavFiles)expect(audio).toContain(`${name}.wav`);
});

it('maps every combat archetype and major battle event to a sample',()=>{
 const action=readFileSync('src/systems/ActionCombat.ts','utf8');
 for(const name of ['attack','sniper','laser','melee','explosion','drone'])expect(action).toContain(`'${name}'`);
 const model=readFileSync('src/systems/BattleModel.ts','utf8');
 for(const name of ['summon','merge','level','relic','boss','victory','defeat'])expect(model).toContain(`"${name}"`);
 expect(readFileSync('src/systems/CombatSystem.ts','utf8')).toContain('"core"');
 const audio=readFileSync('src/utils/Audio.ts','utf8');expect(audio).toContain("requested==='boss-end'");expect(audio).toContain("this.stop('boss')");
 expect(model).toContain("onSound?.('boss-end')");
});
