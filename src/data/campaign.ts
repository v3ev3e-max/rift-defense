import {campaignRegionBalance} from './campaignBalance';
import type {BattleMap, Slot} from './map';
import type {Wave} from './waves';
import {enemies} from './enemies';
export interface CampaignStage {
 id:string; name:string; waves:number; power:number; reward:number;
 enemies:string[]; recommendation:string; mechanic:string; map:BattleMap; alternate?:BattleMap; background:string;
 enemyHp:number; enemyAttack:number; enemySpeed:number;
}
export interface CampaignWorldline {id:1|2; code:string; name:string; subtitle:string; regions:number[]; prologue:string; objective:string;}
export const campaignWorldlines:CampaignWorldline[]=[
 {id:1,code:'WL-01',name:'낙원 붕괴',subtitle:'지상 균열 원정',regions:[1,2,3,4],prologue:'평온했던 바람 초원에 최초의 균열이 열린다. 유리아, 레이나, 세라, 노엘, 아린은 침공의 흔적을 따라 해안과 고대 수림을 지나 설원 성문으로 향한다.',objective:'설원 성문 너머의 균열을 봉쇄하고 지상 침공의 근원을 확인한다.'},
 {id:2,code:'WL-02',name:'폐쇄 연구구역',subtitle:'인공 세계선 추적',regions:[5,6,7,8],prologue:'봉쇄된 균열에서 세라의 장비가 다른 세계의 구조 신호를 수신한다. 다섯 요원은 버려진 연구구역으로 진입해 인공 균열 실험의 진실을 추적한다.',objective:'연구소 심층부와 공허 관측소를 돌파하고 세계선을 연결하는 균열 핵을 파괴한다.'},
];
export const campaignWorldline=(stage:CampaignStage|string)=>campaignRegion(stage)<=4?campaignWorldlines[0]:campaignWorldlines[1];
export const campaignLocalRegion=(stage:CampaignStage|string)=>((campaignRegion(stage)-1)%4)+1;
export const campaignStageLabel=(stage:CampaignStage|string)=>{const id=typeof stage==='string'?stage:stage.id,[,operation='1']=id.split('-');return `${campaignWorldline(stage).id}-${campaignLocalRegion(stage)}-${operation}`;};
export const worldlineUnlocked=(id:number,records:Record<string,unknown>)=>id===1||!!records['4-10'];
export const regionalStories=[
 {title:'바람에 열린 문',text:'초원의 생태가 균열 파동에 뒤틀린다. 다섯 요원은 처음으로 한 팀이 되어 주민의 퇴로를 확보한다.'},
 {title:'해안의 잔향',text:'바다 아래에서도 같은 신호가 반복된다. 노엘은 균열이 자연 발생이 아니라 좌표를 따라 이동한다는 사실을 발견한다.'},
 {title:'기억하는 숲',text:'고목에 남은 기록은 오래전에도 같은 침공이 있었음을 보여준다. 아린은 사라진 관측대의 좌표를 복원한다.'},
 {title:'설원 성문의 결전',text:'성문을 지키는 수호체를 쓰러뜨리자 균열은 닫히지만, 세라의 장비에 정체불명의 구조 신호가 남는다.'},
 {title:'응답 없는 연구동',text:'구조 신호의 반대편은 폐쇄된 연구시설이다. 레이나는 시설이 균열을 막은 곳이 아니라 만들어 낸 곳임을 의심한다.'},
 {title:'얼어붙은 증거',text:'냉각 구획의 기록에서 여러 세계선을 겹치는 실험이 확인된다. 유리아의 방벽과 동일한 에너지 흔적도 발견된다.'},
 {title:'관측자의 진실',text:'공허 관측소는 다른 세계의 붕괴를 에너지원으로 사용했다. 노엘은 자신의 기록 일부가 이 시설에서 만들어졌음을 깨닫는다.'},
 {title:'세계선의 심장',text:'다섯 요원은 모든 좌표가 만나는 균열 핵으로 향한다. 핵을 파괴해야 두 세계의 연쇄 붕괴를 멈출 수 있다.'},
] as const;
function map(id:string,name:string,points:number[][],pads:number[][]):BattleMap {
 const path=points.map(([x,y])=>({x,y}));
 const segments=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y));
 return {id,name,description:'최대 5명 자유 편성 · 6칸 중 선택 배치 · 이동 10초',path,segments,pathLength:segments.reduce((a,b)=>a+b,0),slots:pads.map(([x,y])=>({x,y,type:'any'} as Slot)),obstacles:[],tint:0xffffff,
  pathPoint(distance,out){for(let i=0;i<segments.length;i++){if(distance<=segments[i]){const t=Math.max(0,distance)/segments[i];out.x=path[i].x+(path[i+1].x-path[i].x)*t;out.y=path[i].y+(path[i+1].y-path[i].y)*t;return out;}distance-=segments[i];}Object.assign(out,path[path.length-1]);return out;}};
}
const regions=[
 {names:['바람 초원 입구','고대 수로','꽃바람 언덕','초원 순찰로','바람개비 평원','고대 정원','폭풍 전야','수호자의 길','초원 심장부','초원 수호전'],background:'map-01-meadow.webp',enemies:['crawler','runner'],hp:1.10,attack:.45,speed:.46,power:420,reward:260,recommendation:'유리아 + 레이나',theme:'기본 배치와 전방 저지를 익히세요.'},
 {names:['푸른 해안길','산호 협곡','폭풍 부두','해풍 관문','침수 산책로','파도 절벽','난파선 해역','등대 방어선','해안 심층부','해안 요새전'],background:'map-02-coast.webp',enemies:['crawler','runner','sprinter'],hp:1.17,attack:.50,speed:.48,power:620,reward:360,recommendation:'아린 + 레이나',theme:'고속 적을 후방 저격과 분산 화력으로 끊으세요.'},
 {names:['단풍 숲길','정령의 샘','붉은 수림','낙엽 회랑','고목 뿌리길','정령 안식처','안개 숲','수호목 외곽','수림 심장부','고목 수호전'],background:'map-03-autumn.webp',enemies:['crawler','runner','sprinter','brute'],hp:1.24,attack:.56,speed:.50,power:850,reward:480,recommendation:'카린 + 세라',theme:'속도가 다른 적의 진입 순서를 읽고 대응하세요.'},
 {names:['설원 초소','빙결 계곡','성문 외곽','눈보라 협로','얼음 호수','백야 관문','동결 회랑','설산 방벽','성문 접근로','설원 성문전'],background:'map-04-snow.webp',enemies:['runner','sprinter','brute','armored'],hp:1.31,attack:.62,speed:.52,power:1100,reward:620,recommendation:'유리아 + 아린',theme:'중장 적을 붙잡고 관통 화력을 집중하세요.'},
 {names:['연구 통로','동력 구획','격리 실험실','표본 보관소','제어 관제실','증폭 실험동','폐쇄 격납고','위험물 구획','중앙 연결부','중앙 연구동'],background:'straight-lab.png',enemies:['crawler','armored','brute'],hp:1.38,attack:.72,speed:.54,power:1400,reward:800,recommendation:'네리스 + 아델라',theme:'중장 적이 섞인 밀집 공세를 우선순위 화력으로 분리하세요.'},
 {names:['냉각 통로','빙결 저장고','극저온 구획','냉매 수송로','동결 실험동','냉각 제어실','백색 격리실','심층 저장고','냉각로 외곽','냉각로 방어전'],background:'region-2.webp',enemies:['runner','armored','brute','jammer'],hp:1.65,attack:1.00,speed:.56,power:1800,reward:1050,recommendation:'리비아 + 노엘',theme:'장비와 속성 조합으로 복합 공세를 돌파하세요.'},
 {names:['심연 관측로','위상 격리실','공허 관측소','잔향 회랑','위상 접속부','심연 표본실','공허 억제실','관측 제어실','심연 연결부','심연 연구동'],background:'region-3.webp',enemies:['sprinter','bulwark','phantom','jammer'],hp:2.05,attack:1.18,speed:.58,power:2300,reward:1350,recommendation:'레온 + 세린',theme:'위상 적과 방벽 적을 도발과 집중 화력으로 분리하세요.'},
 {names:['균열 접근로','붕괴 회랑','공허 핵실','왜곡 교차로','균열 전초지','붕괴 관측실','심층 공허로','핵심 방벽','최종 접근로','최종 균열전'],background:'map-08-rift.webp',enemies:['armored','jammer','phantom','bulwark','elite'],hp:2.45,attack:1.38,speed:.60,power:3000,reward:1750,recommendation:'오로라 + 레온',theme:'완성된 장비와 조합으로 최종 균열을 봉쇄하세요.'},
] as const;
export const CAMPAIGN_STAGES_PER_REGION=10;
// Introduce split routes gradually: the opening area teaches one lane, then
// later regions ask for broader coverage more often without diluting boss focus.
const dualLaneStageIds=new Set([
 '2-7',
 '3-4','3-8',
 '4-3','4-7',
 '5-4','5-8',
 '6-3','6-7',
 '7-2','7-6','7-9',
 '8-2','8-3','8-7',
]);
export const campaignStages:CampaignStage[]=regions.flatMap((region,ri)=>region.names.map((name,si)=>{const number=si+1,id=`${ri+1}-${number}`,mid=number===5,final=number===CAMPAIGN_STAGES_PER_REGION,early=ri<5,dualLane=dualLaneStageIds.has(id);return {id,name,waves:final?8:mid?6:4,power:region.power+si*Math.round(region.power*.05),reward:region.reward+si*Math.round(region.reward*.07),enemies:[...region.enemies],recommendation:dualLane?'탱커 2명 + 양 라인 화력 분산':region.recommendation,mechanic:`${region.theme}${dualLane?' 두 갈래 균열에서 적이 교대로 진입합니다. 각 라인에 전방 요원을 배치하세요.':''}${final?' 지역 최종보스가 마지막 웨이브에 출현합니다.':mid?' 지역 중간보스가 마지막 웨이브에 출현합니다.':' 마지막 웨이브의 네임드를 처치하면 완료됩니다.'}`,map:map(id,name,dualLane?[[750,340],[200,340],[50,400]]:[[750,400],[50,400]],[]),alternate:dualLane?map(`${id}-lower`,`${name} 하단 균열`,[[750,460],[200,460],[50,400]],[]):undefined,background:`map-${ri+1}-1.webp`,enemyHp:+(campaignRegionBalance[ri].hp*(1+si*.004)).toFixed(3),enemyAttack:+(campaignRegionBalance[ri].attack*(1+si*.004)).toFixed(3),enemySpeed:+(campaignRegionBalance[ri].speed+si*.001).toFixed(3)};}));
export function campaignRegion(stage:CampaignStage|string){return Math.max(1,Math.min(8,Number((typeof stage==='string'?stage:stage.id).split('-')[0])||1));}
const regionalNamed=['named_meadow','named_coast','named_autumn','named_snow','named_lab','named_cold','named_abyss','named_rift'] as const;
export const regionalMidBoss=['verdant_stalker','coral_mauler','thorn_matriarch','frost_howler','security_exarch','cryo_hunter','phase_reaper','rift_executioner'] as const;
export const regionalFinalBoss=['gale_colossus','leviathan','ancient_treant','glacial_tyrant','reactor_behemoth','absolute_zero','void_observer','rift_sovereign'] as const;
export function campaignWave(stage:CampaignStage,n:number):Wave{
 const region=campaignRegion(stage),sub=Number(stage.id.split('-')[1])||1;
 const pool=stage.enemies;
 const dense=[3,8].includes(sub),fast=sub===2,mixed=[4,6,7,9].includes(sub);
 const count=7+n+(region-1)+Math.floor((sub-1)/3)+(dense?3:0)-(stage.waves>4?2:0)-(stage.id==='4-10'?2:0);
 const list=Array.from({length:count},(_,i)=>{
  if(fast&&pool.includes('sprinter')&&i%3===2)return 'sprinter';
  if(fast&&pool.includes('runner')&&i%2===1)return 'runner';
  const available=mixed||n>=3?pool.length:Math.min(pool.length,2);
  return pool[(i+n-1)%available];
 });
 // A small fast vanguard reaches the formation before the slower main group.
 // It tests block capacity and rear coverage without inflating every enemy's HP.
 const vanguard=stage.waves>4?0:region<=2?3:region<=5?4:5;
 list.unshift(...Array<string>(vanguard).fill('sprinter'));
 const boss=n===stage.waves?(sub===5?regionalMidBoss[region-1]:sub===CAMPAIGN_STAGES_PER_REGION?regionalFinalBoss[region-1]:undefined):undefined;
 const objective=n===stage.waves?(boss??regionalNamed[region-1]):undefined;
 return {number:n,enemies:list,interval:Math.max(.62,.98-(region-1)*.015-sub*.002-(dense?.16:0)),reward:20+n*3+region*2,elite:n===stage.waves&&!boss,boss,objective,objectiveName:boss?undefined:enemies[regionalNamed[region-1]].name,phase:stage.name};
}
export function stageUnlocked(id:string,records:Record<string,unknown>){const i=campaignStages.findIndex(s=>s.id===id);return i===0||i>0&&!!records[campaignStages[i-1].id];}
const tacticalPads:Slot[]=[{x:375,y:300,type:'any'},{x:495,y:300,type:'any'},{x:375,y:500,type:'any'},{x:495,y:500,type:'any'},{x:560,y:400,type:'any'},{x:400,y:400,type:'any'}];
campaignStages.forEach(stage=>{stage.map.slots=tacticalPads.map(p=>({...p}));});
/** Split routes support either two dedicated fronts or one central tank covering both lanes. */
export const frontlineSlots=(stage?:CampaignStage)=>stage?.alternate?[1,3,4]:[4];
export const isFrontlineSlot=(stage:CampaignStage|undefined,slot:number)=>frontlineSlots(stage).includes(slot);
export function pathExposure(stage:CampaignStage,point:{x:number;y:number},range:number){return [stage.map,stage.alternate].filter(Boolean).map(route=>{let length=0;const p={x:0,y:0};for(let d=0;d<route!.pathLength;d+=2){route!.pathPoint(d,p);if(Math.hypot(p.x-point.x,p.y-point.y)<=range)length+=Math.min(2,route!.pathLength-d);}return length;});}
export const doctrines=[{id:'rapid',name:'연사 지원',text:'공격 속도 +6% → 최대 +24%'},{id:'focus',name:'집중 타격',text:'피해 +5%, 보스 추가 +3% → 최대 +20% / +12%'},{id:'guard',name:'방어 지원',text:'받는 피해 −5% → 최대 −20% · 웨이브 종료 HP 10%, 코어 2 회복'}] as const;
