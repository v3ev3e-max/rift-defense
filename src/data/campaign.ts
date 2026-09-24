import {campaignRegionBalance} from './campaignBalance';
import type {BattleMap, Slot} from './map';
import type {Wave} from './waves';
import {enemies} from './enemies';
export interface CampaignStage {
 id:string; name:string; waves:number; power:number; reward:number;
 enemies:string[]; recommendation:string; mechanic:string; map:BattleMap; alternate?:BattleMap; background:string;
 enemyHp:number; enemyAttack:number; enemySpeed:number;
}
export interface CampaignWorldline {id:1|2|3|4; code:string; name:string; subtitle:string; regions:number[]; prologue:string; objective:string;}
export const campaignWorldlines:CampaignWorldline[]=[
 {id:1,code:'WL-01',name:'낙원 붕괴',subtitle:'지상 균열 원정',regions:[1,2,3,4],prologue:'평온했던 바람 초원에 최초의 균열이 열린다. 유리아, 레이나, 세라, 노엘, 아린은 침공의 흔적을 따라 해안과 고대 수림을 지나 설원 성문으로 향한다.',objective:'설원 성문 너머의 균열을 봉쇄하고 지상 침공의 근원을 확인한다.'},
 {id:2,code:'WL-02',name:'폐쇄 연구구역',subtitle:'인공 세계선 추적',regions:[5,6,7,8],prologue:'봉쇄된 균열에서 세라의 장비가 다른 세계의 구조 신호를 수신한다. 다섯 요원은 버려진 연구구역으로 진입해 인공 균열 실험의 진실을 추적한다.',objective:'연구소 심층부와 공허 관측소를 돌파하고 세계선을 연결하는 균열 핵을 파괴한다.'},
 {id:3,code:'WL-03',name:'시간 파편 전선',subtitle:'붕괴 세계 추격전',regions:[9,10,11,12],prologue:'균열 핵이 파괴되며 흩어진 시간 파편이 네 개의 붕괴 세계를 연결한다. 다섯 요원은 천공 유적과 황혼 사막, 기계 도시를 거쳐 모든 시간을 삼키는 영겁의 성채를 추격한다.',objective:'각 세계의 지배자를 격파하고 영겁의 군주가 완성하려는 시간 고리를 끊는다.'},
 {id:4,code:'WL-04',name:'기원 심연',subtitle:'원초 균열 종심전',regions:[13,14,15,16],prologue:'끊어진 시간 고리의 안쪽에서 최초의 균열 좌표가 드러난다. 원정대는 수정 심해와 월광 생태원, 성간 제련소를 지나 모든 세계선의 기원으로 진입한다.',objective:'네 개의 기원 좌표를 안정화하고 원초 균열의 재기동을 저지한다.'},
];
export const campaignWorldline=(stage:CampaignStage|string)=>campaignWorldlines[Math.min(campaignWorldlines.length-1,Math.floor((campaignRegion(stage)-1)/4))];
export const campaignLocalRegion=(stage:CampaignStage|string)=>((campaignRegion(stage)-1)%4)+1;
/** Player-facing stage labels match the stable save ID. Worldline context is
 * rendered separately so a stage never becomes an ambiguous 1-1-1. */
export const campaignStageLabel=(stage:CampaignStage|string)=>typeof stage==='string'?stage:stage.id;
export const campaignWorldlineLabel=(stage:CampaignStage|string)=>{const worldline=campaignWorldline(stage);return `${worldline.code} · ${worldline.name}`;};
export const worldlineUnlocked=(id:number,records:Record<string,unknown>)=>id===1||!!records[`${(id-1)*4}-10`];
export const regionalStories=[
 {title:'바람에 열린 문',text:'초원의 생태가 균열 파동에 뒤틀린다. 다섯 요원은 처음으로 한 팀이 되어 주민의 퇴로를 확보한다.'},
 {title:'해안의 잔향',text:'바다 아래에서도 같은 신호가 반복된다. 노엘은 균열이 자연 발생이 아니라 좌표를 따라 이동한다는 사실을 발견한다.'},
 {title:'기억하는 숲',text:'고목에 남은 기록은 오래전에도 같은 침공이 있었음을 보여준다. 아린은 사라진 관측대의 좌표를 복원한다.'},
 {title:'설원 성문의 결전',text:'성문을 지키는 수호체를 쓰러뜨리자 균열은 닫히지만, 세라의 장비에 정체불명의 구조 신호가 남는다.'},
 {title:'응답 없는 연구동',text:'구조 신호의 반대편은 폐쇄된 연구시설이다. 레이나는 시설이 균열을 막은 곳이 아니라 만들어 낸 곳임을 의심한다.'},
 {title:'얼어붙은 증거',text:'냉각 구획의 기록에서 여러 세계선을 겹치는 실험이 확인된다. 유리아의 방벽과 동일한 에너지 흔적도 발견된다.'},
 {title:'관측자의 진실',text:'공허 관측소는 다른 세계의 붕괴를 에너지원으로 사용했다. 노엘은 자신의 기록 일부가 이 시설에서 만들어졌음을 깨닫는다.'},
 {title:'세계선의 심장',text:'다섯 요원은 모든 좌표가 만나는 균열 핵으로 향한다. 핵을 파괴해야 두 세계의 연쇄 붕괴를 멈출 수 있다.'},
 {title:'구름 위의 잔해',text:'핵의 파편이 하늘 유적을 떠받치고 있다. 돌풍에 밀려나는 전선을 지키며 첫 시간 좌표를 회수한다.'},
 {title:'태양이 멈춘 사막',text:'멈춘 태양 아래 신기루 군단이 되살아난다. 치유 적을 먼저 끊어 황혼의 고리를 파괴한다.'},
 {title:'스스로 고치는 도시',text:'기계 도시는 침입자를 재료로 삼아 군단을 수복한다. 수복망을 차단하고 도시의 신핵으로 향한다.'},
 {title:'영겁의 마지막',text:'서로 다른 시간이 한 성채에 겹친다. 반복되는 돌진과 되감기를 버티고 세계선의 고리를 끝낸다.'},
 {title:'수정 심해의 항로',text:'시간 고리 아래 숨겨진 수정 군도가 기원 신호에 반응한다. 부유 항로를 확보하고 첫 좌표를 회수한다.'},
 {title:'달빛 생태원의 맥박',text:'멈춘 생태원이 침입자를 양분 삼아 깨어난다. 재생 연결망을 끊고 월핵의 문을 연다.'},
 {title:'별을 벼리는 도시',text:'성간 제련소가 무한히 병기를 찍어낸다. 수복기와 포탑을 무너뜨리고 기원 열쇠를 탈환한다.'},
 {title:'모든 균열의 시작',text:'네 좌표가 원초 성채에서 하나로 겹친다. 두 전선을 지키며 최초의 균열을 영구 봉쇄한다.'},
] as const;
function map(id:string,name:string,points:number[][],pads:number[][]):BattleMap {
 const path=points.map(([x,y])=>({x,y}));
 const segments=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y));
 return {id,name,description:'최대 5명 자유 편성 · 6칸 중 선택 배치 · 이동 10초',path,segments,pathLength:segments.reduce((a,b)=>a+b,0),slots:pads.map(([x,y])=>({x,y,type:'any'} as Slot)),obstacles:[],tint:0xffffff,
  pathPoint(distance,out){for(let i=0;i<segments.length;i++){if(distance<=segments[i]){const t=Math.max(0,distance)/segments[i];out.x=path[i].x+(path[i+1].x-path[i].x)*t;out.y=path[i].y+(path[i+1].y-path[i].y)*t;return out;}distance-=segments[i];}Object.assign(out,path[path.length-1]);return out;}};
}
const regions=[
 {names:['바람 초원 입구','고대 수로','꽃바람 언덕','초원 순찰로','바람개비 평원','고대 정원','폭풍 전야','수호자의 길','초원 심장부','초원 수호전'],background:'map-01-meadow.webp',enemies:['crawler','runner','sprinter'],hp:1.10,attack:.45,speed:.46,power:420,reward:260,recommendation:'유리아 + 레이나',theme:'기본 배치와 전방 저지를 익히세요.'},
 {names:['푸른 해안길','산호 협곡','폭풍 부두','해풍 관문','침수 산책로','파도 절벽','난파선 해역','등대 방어선','해안 심층부','해안 요새전'],background:'map-02-coast.webp',enemies:['crawler','runner','sprinter'],hp:1.17,attack:.50,speed:.48,power:620,reward:360,recommendation:'아린 + 레이나',theme:'고속 적을 후방 저격과 분산 화력으로 끊으세요.'},
 {names:['단풍 숲길','정령의 샘','붉은 수림','낙엽 회랑','고목 뿌리길','정령 안식처','안개 숲','수호목 외곽','수림 심장부','고목 수호전'],background:'map-03-autumn.webp',enemies:['crawler','runner','sprinter','brute'],hp:1.24,attack:.56,speed:.50,power:850,reward:480,recommendation:'카린 + 세라',theme:'속도가 다른 적의 진입 순서를 읽고 대응하세요.'},
 {names:['설원 초소','빙결 계곡','성문 외곽','눈보라 협로','얼음 호수','백야 관문','동결 회랑','설산 방벽','성문 접근로','설원 성문전'],background:'map-04-snow.webp',enemies:['runner','sprinter','brute','armored'],hp:1.31,attack:.62,speed:.52,power:1100,reward:620,recommendation:'유리아 + 아린',theme:'중장 적을 붙잡고 관통 화력을 집중하세요.'},
 {names:['연구 통로','동력 구획','격리 실험실','표본 보관소','제어 관제실','증폭 실험동','폐쇄 격납고','위험물 구획','중앙 연결부','중앙 연구동'],background:'straight-lab.png',enemies:['crawler','armored','brute'],hp:1.38,attack:.72,speed:.54,power:1400,reward:800,recommendation:'네리스 + 아델라',theme:'중장 적이 섞인 밀집 공세를 우선순위 화력으로 분리하세요.'},
 {names:['냉각 통로','빙결 저장고','극저온 구획','냉매 수송로','동결 실험동','냉각 제어실','백색 격리실','심층 저장고','냉각로 외곽','냉각로 방어전'],background:'region-2.webp',enemies:['runner','armored','brute','jammer'],hp:1.65,attack:1.00,speed:.56,power:1800,reward:1050,recommendation:'리비아 + 노엘',theme:'장비와 속성 조합으로 복합 공세를 돌파하세요.'},
 {names:['심연 관측로','위상 격리실','공허 관측소','잔향 회랑','위상 접속부','심연 표본실','공허 억제실','관측 제어실','심연 연결부','심연 연구동'],background:'region-3.webp',enemies:['sprinter','bulwark','phantom','jammer'],hp:2.05,attack:1.18,speed:.58,power:2300,reward:1350,recommendation:'레온 + 세린',theme:'위상 적과 방벽 적을 도발과 집중 화력으로 분리하세요.'},
 {names:['균열 접근로','붕괴 회랑','공허 핵실','왜곡 교차로','균열 전초지','붕괴 관측실','심층 공허로','핵심 방벽','최종 접근로','최종 균열전'],background:'map-08-rift.webp',enemies:['armored','jammer','phantom','bulwark','elite'],hp:2.45,attack:1.38,speed:.60,power:3000,reward:1750,recommendation:'오로라 + 레온',theme:'완성된 장비와 조합으로 최종 균열을 봉쇄하세요.'},
 {names:['부유섬 진입로','구름 회랑','천공 외곽','부서진 다리','폭풍 제단','비행선 잔해','상층 정원','낙뢰 관문','왕좌 접근로','천공 지배전'],background:'map-09-1.webp',enemies:['sky_guard','sky_lancer','cloud_gunner','aether_mender'],hp:3.0,attack:1.55,speed:.62,power:3800,reward:2200,recommendation:'2탱커 + 원거리 우선 사격',theme:'주기적인 돌풍과 돌진을 버티고 치유익을 먼저 처치하세요.'},
 {names:['황혼 협곡','사구 관문','태양 수로','유적 외곽','신기루 제단','매몰 회랑','황금 채굴장','일몰 성벽','신전 접근로','태양 심판전'],background:'map-10-1.webp',enemies:['relic_golem','dune_ripper','sun_archer','mirage_oracle'],hp:3.45,attack:1.72,speed:.63,power:4800,reward:2800,recommendation:'돌진 저지 + 지원 적 점사',theme:'신기루가 적을 회복합니다. 지원 적을 끊고 중장 적에 화력을 모으세요.'},
 {names:['강철 하역장','기어 회랑','용광로 외곽','맥동 배관','수복 관제실','합금 조립소','증기 교차로','중앙 제철소','신핵 접근로','기계신 격전'],background:'map-11-1.webp',enemies:['alloy_guard','gear_hound','pulse_turret','repair_weaver'],hp:3.9,attack:1.9,speed:.64,power:6100,reward:3500,recommendation:'방벽 파괴 + 수복기 우선',theme:'수복망이 주변 적의 체력을 회복합니다. 포탑과 수복기를 빠르게 제거하세요.'},
 {names:['시간 균열 입구','역행 회랑','파편 정원','초침 교차로','되감기 제단','멈춘 전망대','역설 감옥','영겁 방벽','최후 시간선','영겁 종결전'],background:'map-12-1.webp',enemies:['paradox_shell','chrono_stalker','epoch_caster','time_mender'],hp:4.4,attack:2.08,speed:.66,power:7800,reward:4500,recommendation:'이중 전선 + 네임드 집중',theme:'시간 도약과 되감기가 반복됩니다. 두 전선의 저지선을 유지하세요.'},
 {names:['수정 항구','푸른 단층','심해 회랑','유리 산호초','파도 제단','부유 정원','빙정 관문','심연 교각','핵광 접근로','수정 군도전'],background:'map-13-1.png',enemies:['sky_guard','sky_lancer','cloud_gunner','aether_mender'],hp:4.8,attack:2.25,speed:.68,power:9400,reward:5400,recommendation:'중장 저지 + 치유익 우선',theme:'수정 장벽과 지원 적이 전선을 고착시킵니다. 회복 연결을 먼저 끊으세요.'},
 {names:['월광 온실','포자 회랑','은빛 수로','생체 격리실','달의 심장','재생 정원','환영 묘목원','월핵 방벽','심층 배양실','월식 수호전'],background:'map-14-1.png',enemies:['relic_golem','dune_ripper','sun_archer','mirage_oracle'],hp:5.2,attack:2.42,speed:.69,power:11200,reward:6500,recommendation:'지원 적 점사 + 후열 보호',theme:'환영과 재생이 겹칩니다. 후열을 지키며 지원 개체를 빠르게 제거하세요.'},
 {names:['성간 도크','용광성 회랑','합금 성운','맥동 제련로','항성 모루','수복 격납고','플라즈마 교차로','신성 제철소','별핵 접근로','성간 제련전'],background:'map-15-1.png',enemies:['alloy_guard','gear_hound','pulse_turret','repair_weaver'],hp:5.7,attack:2.62,speed:.70,power:13400,reward:7800,recommendation:'방벽 파괴 + 원거리 제압',theme:'포탑과 중장 병력이 교차 사격합니다. 방벽을 깨고 사격선을 분산하세요.'},
 {names:['기원 문턱','태초 회랑','원초 정원','인과 교차로','창세 제단','무한 전망대','세계선 감옥','기원 방벽','최초 좌표','원초 균열전'],background:'map-16-1.png',enemies:['paradox_shell','chrono_stalker','epoch_caster','time_mender'],hp:6.2,attack:2.85,speed:.72,power:16000,reward:9500,recommendation:'이중 탱커 + 지원 차단',theme:'모든 지원 패턴이 결합됩니다. 두 전선을 유지하며 치유와 방벽을 순서대로 끊으세요.'},
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
 '9-2','9-6','9-8','10-3','10-7','11-2','11-6','11-9','12-2','12-4','12-7','12-9','13-2','13-8','14-2','14-4','14-7','14-9','15-2','15-4','15-6','15-8','16-2','16-3','16-7','16-9',
]);
export const campaignStages:CampaignStage[]=regions.flatMap((region,ri)=>region.names.map((name,si)=>{const number=si+1,id=`${ri+1}-${number}`,mid=number===5,final=number===CAMPAIGN_STAGES_PER_REGION,dualLane=dualLaneStageIds.has(id),lateRoute=ri>=8,upper=lateRoute?[[750,360],[650,320],[520,360],[360,340],[210,390],[50,400]]:[[750,400],[50,400]],lower=lateRoute?[[750,440],[650,480],[520,440],[360,460],[210,410],[50,400]]:[[750,460],[200,460],[50,400]];const operationHp=Math.pow(ri===0?1.07:ri<5?1.025:1.018,si),operationAttack=Math.pow(ri===0?1.055:ri<5?1.02:1.015,si),operationSpeed=si*(ri===0?.003:.0025);return {id,name,waves:final?8:mid?6:4,power:region.power+si*Math.round(region.power*.05),reward:region.reward+si*Math.round(region.reward*.07),enemies:[...region.enemies],recommendation:dualLane||mid||final?'탱커 2명 + 전방 유지 · 화력 분산':region.recommendation,mechanic:`${region.theme}${dualLane?' 두 갈래 균열에서 적이 교대로 진입합니다. 각 라인에 전방 요원을 배치하세요.':''}${final?' 지역 최종보스가 마지막 웨이브에 출현합니다.':mid?' 지역 중간보스가 마지막 웨이브에 출현합니다.':' 마지막 웨이브의 네임드를 처치하면 완료됩니다.'}`,map:map(id,name,dualLane?upper:lateRoute?(si%2?upper:[[750,400],[610,450],[460,380],[300,430],[160,370],[50,400]]):[[750,400],[50,400]],[]),alternate:dualLane?map(`${id}-lower`,`${name} 하단 균열`,lower,[]):undefined,background:region.background,enemyHp:+(campaignRegionBalance[ri].hp*operationHp).toFixed(3),enemyAttack:+(campaignRegionBalance[ri].attack*operationAttack).toFixed(3),enemySpeed:+(campaignRegionBalance[ri].speed+operationSpeed).toFixed(3)};}));
export function campaignRegion(stage:CampaignStage|string){return Math.max(1,Math.min(regions.length,Number((typeof stage==='string'?stage:stage.id).split('-')[0])||1));}
export const campaignLaneAsset=(region:number)=>`/assets/campaign/lanes/region-${String(Math.max(1,Math.min(regions.length,region))).padStart(2,'0')}.webp`;
const regionalNamed=['named_meadow','named_coast','named_autumn','named_snow','named_lab','named_cold','named_abyss','named_rift','named_sky','named_dune','named_machine','named_time','named_sky','named_dune','named_machine','named_time'] as const;
export const regionalMidBoss=['verdant_stalker','coral_mauler','thorn_matriarch','frost_howler','security_exarch','cryo_hunter','phase_reaper','rift_executioner','storm_wyvern','sand_colossus','forge_overseer','chrono_reaper','storm_wyvern','sand_colossus','forge_overseer','chrono_reaper'] as const;
export const regionalFinalBoss=['gale_colossus','leviathan','ancient_treant','glacial_tyrant','reactor_behemoth','absolute_zero','void_observer','rift_sovereign','sky_dominion','solar_sphinx','machine_god','aeon_sovereign','sky_dominion','solar_sphinx','machine_god','aeon_sovereign'] as const;
export function campaignWave(stage:CampaignStage,n:number):Wave{
 const region=campaignRegion(stage),sub=Number(stage.id.split('-')[1])||1;
 const pool=stage.enemies;
 const fast=sub===2,mixed=[4,6,7,8,9].includes(sub);
 // Every region follows the same readable rhythm. Regular operations climb
 // steadily; mid/final bosses trade raw lane density for extra waves and the
 // objective encounter instead of creating saw-tooth difficulty spikes.
 const operationPressure=[0,1,2,3,2,3,4,5,6,4][sub-1];
 const count=7+n+(region-1)+operationPressure-(stage.waves>4?2:0)-(stage.waves===8?(region===1?7:6):0)-(stage.id==='4-10'?2:0);
 const list=Array.from({length:count},(_,i)=>{
  if(region===1&&sub>=4&&i%(stage.waves>4?12:7)===5)return 'armored';
  if(region===1&&sub>=3&&i%(stage.waves>4?10:6)===4)return 'brute';
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
 const operationTempo=[0,.035,.07,.105,.055,.075,.095,.115,.135,.075][sub-1];
 return {number:n,enemies:list,interval:Math.max(.62,.98-(region-1)*.015-operationTempo),reward:20+n*3+region*2,elite:n===stage.waves&&!boss,boss,objective,objectiveName:boss?undefined:enemies[regionalNamed[region-1]].name,phase:stage.name};
}
/** Every enemy that the wave generator can spawn for a stage, including
 * injected vanguards and final-wave objectives that are not in stage.enemies. */
export function campaignEnemyIds(stage:CampaignStage){
 const ids=new Set<string>();
 for(let n=1;n<=stage.waves;n++){
  const wave=campaignWave(stage,n);
  wave.enemies.forEach(id=>ids.add(id));
  if(wave.objective)ids.add(wave.objective);
  if(wave.boss)ids.add(wave.boss);
 }
 return ids;
}
export function stageUnlocked(id:string,records:Record<string,unknown>){const i=campaignStages.findIndex(s=>s.id===id);return i===0||i>0&&!!records[campaignStages[i-1].id];}
const tacticalPads:Slot[]=[{x:375,y:300,type:'any'},{x:495,y:300,type:'any'},{x:375,y:500,type:'any'},{x:495,y:500,type:'any'},{x:560,y:400,type:'any'},{x:400,y:400,type:'any'}];
campaignStages.forEach(stage=>{stage.map.slots=tacticalPads.map(p=>({...p}));});
/** Split routes support either two dedicated fronts or one central tank covering both lanes. */
export const frontlineSlots=(stage?:CampaignStage)=>stage?.alternate?[1,3,4]:[4];
export const isFrontlineSlot=(stage:CampaignStage|undefined,slot:number)=>frontlineSlots(stage).includes(slot);
export function pathExposure(stage:CampaignStage,point:{x:number;y:number},range:number){return [stage.map,stage.alternate].filter(Boolean).map(route=>{let length=0;const p={x:0,y:0};for(let d=0;d<route!.pathLength;d+=2){route!.pathPoint(d,p);if(Math.hypot(p.x-point.x,p.y-point.y)<=range)length+=Math.min(2,route!.pathLength-d);}return length;});}
export const doctrines=[{id:'rapid',name:'연사 지원',text:'공격 속도 +6% → 최대 +24%'},{id:'focus',name:'집중 타격',text:'피해 +5%, 보스 추가 +3% → 최대 +20% / +12%'},{id:'guard',name:'방어 지원',text:'받는 피해 −5% → 최대 −20% · 웨이브 종료 HP 10%, 코어 2 회복'}] as const;
