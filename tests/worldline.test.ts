import {expect,it} from 'vitest';
import {campaignLaneAsset,campaignLocalRegion,campaignStageLabel,campaignStages,campaignWorldline,campaignWorldlines,regionalStories,stageUnlocked,worldlineUnlocked} from '../src/data/campaign';
import {campaignSelect} from '../src/ui/CampaignUI';
import {defaultSave} from '../src/systems/SaveSystem';

it('splits the existing eighty operations into two four-area worldlines',()=>{
 expect(campaignWorldlines.map(v=>v.regions)).toEqual([[1,2,3,4],[5,6,7,8],[9,10,11,12]]);
 expect(campaignStages.filter(v=>campaignWorldline(v).id===1)).toHaveLength(40);
 expect(campaignStages.filter(v=>campaignWorldline(v).id===2)).toHaveLength(40);
 expect(campaignStages.filter(v=>campaignWorldline(v).id===3)).toHaveLength(40);
 expect(campaignLocalRegion('5-1')).toBe(1);
 expect(campaignStageLabel('5-1')).toBe('2-1-1');
 expect(regionalStories).toHaveLength(12);
 expect(new Set(campaignStages.map(v=>v.background))).toHaveLength(12);
 for(const region of campaignWorldlines.flatMap(v=>v.regions)){
  expect(new Set(campaignStages.filter(v=>v.id.startsWith(`${region}-`)).map(v=>v.background))).toEqual(new Set([`map-${region}-1.webp`]));
 }
});

it('provides a generated lane texture for every campaign region',()=>{
 expect(campaignWorldlines.flatMap(v=>v.regions).map(campaignLaneAsset)).toEqual(
  Array.from({length:12},(_,i)=>`/assets/campaign/lanes/region-${String(i+1).padStart(2,'0')}.webp`),
 );
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
 expect(html).toContain('1-1-1');
 expect(html).not.toContain('BGM');
});
