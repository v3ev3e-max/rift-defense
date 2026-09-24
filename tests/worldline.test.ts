import {expect,it} from 'vitest';
import {campaignLaneAsset,campaignLocalRegion,campaignStageLabel,campaignStages,campaignWorldline,campaignWorldlineLabel,campaignWorldlines,regionalStories,stageUnlocked,worldlineUnlocked} from '../src/data/campaign';
import {campaignSelect} from '../src/ui/CampaignUI';
import {defaultSave} from '../src/systems/SaveSystem';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {readFileSync} from 'node:fs';
// @ts-expect-error Vitest runs in Node while the game compiler targets browsers.
import {createHash} from 'node:crypto';

const assetHash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

it('splits 160 operations into four four-area worldlines while keeping simple stage labels',()=>{
 expect(campaignWorldlines.map(v=>v.regions)).toEqual([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]);
 expect(campaignStages.filter(v=>campaignWorldline(v).id===1)).toHaveLength(40);
 expect(campaignStages.filter(v=>campaignWorldline(v).id===2)).toHaveLength(40);
 expect(campaignStages.filter(v=>campaignWorldline(v).id===3)).toHaveLength(40);
 expect(campaignStages.filter(v=>campaignWorldline(v).id===4)).toHaveLength(40);
 expect(campaignLocalRegion('5-1')).toBe(1);
 expect(campaignStageLabel('1-1')).toBe('1-1');
 expect(campaignStageLabel('5-1')).toBe('5-1');
 expect(campaignWorldlineLabel('5-1')).toBe('WL-02 · 폐쇄 연구구역');
 expect(regionalStories).toHaveLength(16);
 expect(new Set(campaignStages.map(v=>v.background))).toHaveLength(16);
 for(const region of campaignWorldlines.flatMap(v=>v.regions)){
  expect(new Set(campaignStages.filter(v=>v.id.startsWith(`${region}-`)).map(v=>v.background)).size).toBe(1);
 }
});

it('provides a generated lane texture for every campaign region',()=>{
 expect(campaignWorldlines.flatMap(v=>v.regions).map(campaignLaneAsset)).toEqual(
  Array.from({length:16},(_,i)=>`/assets/campaign/lanes/region-${String(i+1).padStart(2,'0')}.webp`),
 );
});

it('keeps every new worldline background and lane material distinct',()=>{
 const backgrounds=Array.from({length:4},(_,i)=>assetHash(`public/assets/campaign/map-${i+13}-1.png`));
 const lanes=Array.from({length:4},(_,i)=>assetHash(`public/assets/campaign/lanes/region-${i+13}.webp`));
 expect(new Set(backgrounds).size).toBe(4);
 expect(new Set(lanes).size).toBe(4);
});

it('opens the research worldline after the first finale while preserving sequential stage locks',()=>{
 expect(worldlineUnlocked(2,{})).toBe(false);
 expect(stageUnlocked('5-1',{})).toBe(false);
 const records={'4-10':{stars:1,time:100,kills:1}};
 expect(worldlineUnlocked(2,records)).toBe(true);
 expect(stageUnlocked('5-1',records)).toBe(true);
});

it('renders worldline navigation and its story without adding BGM controls',()=>{
 const save=defaultSave(),html=campaignSelect(save);
 expect(html).toContain('낙원 붕괴');
 expect(html).toContain('폐쇄 연구구역');
 expect(html).toContain('바람에 열린 문');
 expect(html).toContain('>1-1<');
 expect(html).not.toContain('1-1-1');
 expect(html).not.toContain('BGM');
});
