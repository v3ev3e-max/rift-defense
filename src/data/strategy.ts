import {heroes,heroById} from './heroes';
import {combatRoles} from './combatRoles';
import type {Choice} from './types';
import type {Unit} from '../entities/HeroUnit';
export const basePrices:Record<string,number>={yuria:35,reina:35,arin:40,karin:30,sera:30,noel:45,luna:40,mia:35,ian:30,leon:420,adela:85,belka:90,neris:80,noxia:210,livia:190,theria:200,kairon:210,kyle:95,serin:90,aurora:450,arden:430,hana:85,zion:90,gaia:205,elise:215,vera:220,astra:440,solara:460,celestia:480,rhea:35,echo:35,meriel:90,selene:215,ophilia:475};
export const priceFactors={B:1.18,A:1.15,S:1.12,SR:1.08};
// Grade identity is strongest on the first copy, while lower grades gain more
// from repeated merges. This lets an early SR carry a lane and still gives a
// fully merged B unit a useful late-game ceiling.
export const gradeBasePower={B:1,A:1.22,S:1.55,SR:2.15} as const;
export const gradeStarGrowth={B:2.18,A:2.02,S:1.88,SR:1.72} as const;
// Late merges are deliberately non-exponential: B remains the economical
// growth grade, while A earns a clear 4★/5★ payoff instead of falling behind B.
export const gradeStarMultipliers={B:[1,2.18,4.75,9.3,18.5],A:[1,2.02,4.08,9,20.5],S:[1,1.88,3.53,6.64,12.48],SR:[1,1.72,2.96,5.09,8.75]} as const;
export function gradeStarMultiplier(grade:keyof typeof gradeStarMultipliers,star:number){return gradeStarMultipliers[grade][Math.max(0,Math.min(4,star-1))];}
export const gradeCombatBudget={B:{base:1,star:2.18,reaction:0,label:'저비용 고성장'},A:{base:1.22,star:2.02,reaction:.10,label:'속성 조합 특화'},S:{base:1.55,star:1.88,reaction:.12,label:'역할 전문화'},SR:{base:2.15,star:1.72,reaction:.18,label:'초기 집중 화력'}} as const;
export function purchasePrice(id:string,count:number){let price=basePrices[id];for(let i=0;i<count;i++)price=Math.round(price*priceFactors[heroById[id].grade]);return price;}
export function copiesForStar(star:number){return 2**Math.max(0,star-1);}
export function investmentForStar(id:string,star:number){return Array.from({length:copiesForStar(star)},(_,i)=>purchasePrice(id,i)).reduce((a,b)=>a+b,0);}
export const priorities=['auto','boss','core','cluster','fast','hold'] as const;
export const priorityNames={auto:'자동 판단',boss:'보스 우선',core:'코어 근접',cluster:'군집 우선',fast:'고속 우선',hold:'사용 보류'};
export const links=[
 {ids:['sera','reina'],name:'탄막 부대',text:'과열 4회마다 동료 보조 탄막'},
 {ids:['yuria','mia'],name:'방벽 유지 부대',text:'지원 드론이 방벽을 연장하고 저지를 회복'},
 {ids:['noel','arin'],name:'관통 사선',text:'노엘 조준 시 아린이 같은 선으로 레일탄'},
 {ids:['neris','adela'],name:'전도 발전소',text:'수류장 안 연쇄 전이 +2'},
 {ids:['luna','arden'],name:'흑염 천체',text:'운석 지점에 흑염 영역'},
 {ids:['ian','kyle'],name:'드론 네트워크',text:'드론 명중점에서 중계 전격'},
];
export const activeLinks=(units:Unit[])=>links.filter(l=>l.ids.every(id=>units.some(u=>u.heroId===id&&u.slot>=0&&u.hp>0)));
const roleBranches:Record<string,[string,string,string,string]>={burst:['과열 기관총','산탄 탄막','소이 탄창','급속 재장전'],sniper:['대물 저격','관통 사선','속성 조준','충전 조준'],melee:['약점 검격','광역 검무','속성 검인','방벽형'],chain:['집중 전격','다중 전이','표식 전도','축전 회로'],meteor:['질량 운석','유성 군집','흑염 운석','별빛 순환'],shell:['철갑 포격','파편 탄막','소이 폭격','자동 장전'],water:['압축 수류','광역 수류','침식 수류','수류 가속'],drone:['추적 격추','추가 편대','전기 중계','급속 정비'],support:['집중 공명','광역 공명','표식 지원','지휘 가속'],curse:['심연 처형','저주 확산','지속 침식','쇠약 결계']};
export const branchIds=['focus','spread','element','tempo'] as const;
export function growthOptions(id:string,star:number):Choice[]{const names=roleBranches[combatRoles[id].kind];return branchIds.map((key,i)=>({id:key,name:`${heroById[id].name} · ${names[i]}${star===5?' 완성':''}`,tier:star===5?'LEGENDARY':'RARE',effect:'growth',value:star,description:[
 '위험한 단일 대상 집중. 보스·엘리트 피해 증가, 저체력 처형. 5성은 보조 조준타.',
 '기관총은 75% 사거리 안 추가 산탄, 저격 관통 +3, 번개 전이 +2, 드론 +1기. 근접·마법 영역 확대. 5성은 추가 대상 공격.',
 '불은 화상, 물은 45% 감속, 어둠은 출혈, 전기는 표식 가속. 5성은 명중 위치에 속성 영역.',
 '공속 +22%, 충전 +25%. 유리아 저지 +2. 5성 공속 +35%, 충전 +40%, 저지 +2 및 장판 연장.',
 ][i]} as Choice));}
export function growthName(u:Unit){return [u.branch&&growthOptions(u.heroId,3).find(c=>c.id===u.branch)?.name,u.ultimate&&growthOptions(u.heroId,5).find(c=>c.id===u.ultimate)?.name].filter(Boolean).join(' / ')||'기본 장비';}
export const strategyCatalog=heroes.map(h=>({id:h.id,name:h.name,grade:h.grade,price:basePrices[h.id],branches:growthOptions(h.id,3),ultimate:growthOptions(h.id,5)}));
