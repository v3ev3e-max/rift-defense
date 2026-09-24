import type {SaveData} from './types';

export const RAID_DURATION=180;
export const RAID_DAILY_ATTEMPTS=3;
export const raidBosses=[
 {id:'gale-colossus',name:'질풍의 거신',title:'천공 파괴자',pattern:'광역 폭풍 · 전방 파괴',color:'#62e8df'},
 {id:'void-observer',name:'공허의 천안',title:'후열 사냥꾼',pattern:'후열 저격 · 공허 소환',color:'#bd78ff'},
 {id:'machine-god',name:'기계도시의 신핵',title:'증식 병기',pattern:'수복 소환 · 전열 포격',color:'#ff8b55'},
 {id:'solar-sphinx',name:'태양의 스핑크스',title:'황혼 심판자',pattern:'광역 심판 · 후열 표식',color:'#ffd062'},
 {id:'aeon-sovereign',name:'영겁의 군주',title:'시간선 지배자',pattern:'시간 정지 · 분신 소환',color:'#8ba7ff'},
] as const;
export const raidDateKey=(date=new Date())=>date.toISOString().slice(0,10);
export const raidWeekKey=(date=new Date())=>{const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const start=new Date(Date.UTC(d.getUTCFullYear(),0,1));return `${d.getUTCFullYear()}-W${String(Math.ceil((((+d-+start)/86400000)+1)/7)).padStart(2,'0')}`;};
export const weeklyRaidBosses=(date=new Date())=>{const week=Number(raidWeekKey(date).slice(-2));return Array.from({length:3},(_,i)=>raidBosses[(week+i)%raidBosses.length]);};
export const raidAutoDamage=(power:number,auto:boolean,alive=5,summons=0)=>power*(auto?.85:.55)*(alive/5)*Math.max(.6,1-summons*.04);
export const raidManualDamage=(power:number,alive=5)=>power*8*(alive/5);
export function refreshRaid(save:SaveData,date=new Date()){
 const day=raidDateKey(date),week=raidWeekKey(date),r=save.raid;
 if(r.day!==day){r.day=day;r.attempts=RAID_DAILY_ATTEMPTS;r.dailyBest=0;}
 if(r.week!==week){
  if(r.weeklyBest>0){const rank=raidRank(r.weeklyBest),reward=rank==='다이아'?[1200,1500,35]:rank==='플래티넘'?[800,700,20]:rank==='골드'?[500,300,10]:rank==='실버'?[250,0,5]:[100,0,0];save.credits+=reward[0];save.equipmentGold+=reward[1];save.equipmentMaterials+=reward[2];r.lastSettlement=`${rank} 정산 · ${reward[0]}C${reward[1]?` · ${reward[1]}G`:''}${reward[2]?` · 재료 ${reward[2]}`:''}`;}
  r.week=week;r.weeklyDamage=0;r.weeklyBest=0;r.claimed=[];
 }
 return r;
}
export const raidRank=(damage:number)=>damage>=2500000?'다이아':damage>=1500000?'플래티넘':damage>=800000?'골드':damage>=350000?'실버':'브론즈';
