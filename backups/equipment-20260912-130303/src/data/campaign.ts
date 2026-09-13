import type {BattleMap, Slot} from './map';
import type {Wave} from './waves';
export interface CampaignStage {
 id:string; name:string; waves:number; power:number; reward:number;
 enemies:string[]; recommendation:string; mechanic:string; map:BattleMap; alternate?:BattleMap; background:string;
}
function map(id:string,name:string,points:number[][],pads:number[][]):BattleMap {
 const path=points.map(([x,y])=>({x,y}));
 const segments=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y));
 return {id,name,description:'5명 편성 · 6칸 배치 · 이동 10초',path,segments,
  pathLength:segments.reduce((a,b)=>a+b,0),slots:pads.map(([x,y])=>({x,y,type:'any'} as Slot)),obstacles:[],tint:0xffffff,
  pathPoint(distance,out){for(let i=0;i<segments.length;i++){if(distance<=segments[i]){const t=Math.max(0,distance)/segments[i];out.x=path[i].x+(path[i+1].x-path[i].x)*t;out.y=path[i].y+(path[i+1].y-path[i].y)*t;return out;}distance-=segments[i];}Object.assign(out,path[path.length-1]);return out;}
 };
}
export const campaignStages:CampaignStage[]=[
 {id:'1-1',name:'기본 연구 통로',waves:8,power:500,reward:300,enemies:['grunt','sprinter'],recommendation:'세라 + 레이나',mechanic:'오른쪽에서 오는 적을 일자 방어선에서 막으세요.',map:map('1-1','기본 연구 통로',[[750,400],[50,400]],[]),background:'straight-lab.png'},
 {id:'1-2',name:'장거리 사격 실험실',waves:9,power:650,reward:400,enemies:['grunt','brute','sprinter','armored'],recommendation:'노엘 + 아린',mechanic:'긴 직선에서 관통 공격과 전방 배치를 활용하세요.',map:map('1-2','장거리 사격 실험실',[[750,400],[50,400]],[]),background:'straight-lab.png'},
 {id:'1-3',name:'에너지 처리 구역',waves:10,power:800,reward:500,enemies:['grunt','brute','jammer'],recommendation:'네리스 + 아델라',mechanic:'한 줄로 모이는 적에게 수류와 전격을 연결하세요.',map:map('1-3','에너지 처리 구역',[[750,400],[50,400]],[]),background:'straight-lab.png'},
 {id:'1-4',name:'균열 보스 격리실',waves:10,power:1000,reward:700,enemies:['grunt','brute','jammer','phantom'],recommendation:'유리아 + 미아',mechanic:'전방 근접 요원과 후방 지원으로 보스를 저지하세요.',map:map('1-4','균열 보스 격리실',[[750,400],[50,400]],[]),background:'straight-lab.png'},
 {id:'2-1',name:'빙결 냉각 수로',waves:9,power:1200,reward:800,enemies:['crawler','runner','sprinter'],recommendation:'리비아 + 레이나',mechanic:'고속 적이 섞입니다. 빙결과 전방 저지로 사격 시간을 확보하세요.',map:map('2-1','빙결 냉각 수로',[[750,400],[50,400]],[]),background:'region-2.webp'},
 {id:'2-2',name:'수류 압력 시험장',waves:10,power:1400,reward:900,enemies:['crawler','armored','brute','jammer'],recommendation:'네리스 + 아린',mechanic:'원거리 탄환을 요격하고 철갑 적을 관통 공격으로 정리하세요.',map:map('2-2','수류 압력 시험장',[[750,400],[50,400]],[]),background:'region-2.webp'},
 {id:'2-3',name:'동결 표본 보관소',waves:11,power:1650,reward:1050,enemies:['sprinter','bulwark','phantom','jammer'],recommendation:'리비아 + 노엘',mechanic:'중장 적과 원거리 적이 동시에 진입합니다. 공격 우선순위를 조절하세요.',map:map('2-3','동결 표본 보관소',[[750,400],[50,400]],[]),background:'region-2.webp'},
 {id:'2-4',name:'폭풍 냉각로',waves:11,power:1950,reward:1300,enemies:['armored','jammer','phantom','bulwark'],recommendation:'네리스 + 리비아',mechanic:'탄환 요격과 감속을 교대로 사용해 폭풍의 심장을 봉쇄하세요.',map:map('2-4','폭풍 냉각로',[[750,400],[50,400]],[]),background:'region-2.webp'},
 {id:'3-1',name:'심연 관측 통로',waves:10,power:2200,reward:1450,enemies:['crawler','phantom','jammer'],recommendation:'레온 + 세린',mechanic:'위상 적의 교란을 광역 도발과 집중 화력으로 끊으세요.',map:map('3-1','심연 관측 통로',[[750,400],[50,400]],[]),background:'region-3.webp'},
 {id:'3-2',name:'결정 공명 실험실',waves:11,power:2500,reward:1650,enemies:['sprinter','armored','bulwark','phantom'],recommendation:'유리아 + 아린',mechanic:'고속 적 뒤의 중장 적을 저격 관통선에 맞춰 처리하세요.',map:map('3-2','결정 공명 실험실',[[750,400],[50,400]],[]),background:'region-3.webp'},
 {id:'3-3',name:'공허 격리 회랑',waves:12,power:2850,reward:1900,enemies:['jammer','phantom','bulwark','elite'],recommendation:'미아 + 오로라',mechanic:'아군 회복과 보호막을 유지하며 정예 연속 공세를 버티세요.',map:map('3-3','공허 격리 회랑',[[750,400],[50,400]],[]),background:'region-3.webp'},
 {id:'3-4',name:'심연 핵 봉인실',waves:12,power:3300,reward:2400,enemies:['armored','jammer','phantom','bulwark','elite'],recommendation:'레온 + 오로라',mechanic:'모든 방어 수단과 속성 조합을 동원해 심연의 관측자를 봉인하세요.',map:map('3-4','심연 핵 봉인실',[[750,400],[50,400]],[]),background:'region-3.webp'},
];
for(const stage of campaignStages)stage.enemies=stage.enemies.map(id=>id==='grunt'?'crawler':id);
export function campaignWave(stage:CampaignStage,n:number):Wave{
 const index=campaignStages.indexOf(stage),pool=stage.enemies;
 const list=Array.from({length:7+n+index*2},(_,i)=>pool[(i+Math.floor(n/3))%Math.min(pool.length,1+Math.floor(n/3))]);
 if(n===5||(+stage.id[0]>=2&&n===8))list.push('elite');
 const bosses:Record<string,string>={'1-4':'ravager','2-4':'tempest','3-4':'abyssal'};
 return {number:n,enemies:list,interval:Math.max(.78,1.1-index*.018),reward:20+n*3,elite:n===5,boss:n===stage.waves?bosses[stage.id]:undefined,phase:stage.name};
}
export function stageUnlocked(id:string,records:Record<string,unknown>){const i=campaignStages.findIndex(s=>s.id===id);return i===0||i>0&&!!records[campaignStages[i-1].id];}

// 2 upper + 2 lower + 1 frontline + 1 auxiliary pad.
// Every pad accepts every operator; roles come from the chosen formation.
const tacticalPads:Slot[]=[
 {x:375,y:300,type:'any'},{x:495,y:300,type:'any'},
 {x:375,y:500,type:'any'},{x:495,y:500,type:'any'},
 {x:560,y:400,type:'any'},
 {x:400,y:400,type:'any'},
];
campaignStages.forEach(stage=>{stage.map.slots=tacticalPads.map(p=>({...p}));});
export function pathExposure(stage:CampaignStage,point:{x:number;y:number},range:number){
 return [stage.map,stage.alternate].filter(Boolean).map(route=>{
  let length=0;const p={x:0,y:0};
  for(let d=0;d<route!.pathLength;d+=2){route!.pathPoint(d,p);if(Math.hypot(p.x-point.x,p.y-point.y)<=range)length+=Math.min(2,route!.pathLength-d);}
  return length;
 });
}
export const doctrines = [
 {id:'rapid',name:'연사 지원',text:'공격 속도 +6% → 최대 +24%'},
 {id:'focus',name:'집중 타격',text:'피해 +5%, 보스 추가 +3% → 최대 +20% / +12%'},
 {id:'guard',name:'방어 지원',text:'받는 피해 −5% → 최대 −20% · 웨이브 종료 HP 10%, 코어 2 회복'},
] as const;
