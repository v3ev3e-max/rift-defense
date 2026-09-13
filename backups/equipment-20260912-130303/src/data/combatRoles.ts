export type AttackKind='burst'|'sniper'|'chain'|'melee'|'meteor'|'shell'|'water'|'drone'|'support'|'curse';
export const supportOperatorIds=new Set(['yuria','mia','leon','neris','livia']);
export type FormationRole='tank'|'dealer'|'sniper';
export const formationSlots:FormationRole[]=['tank','dealer','dealer','dealer','sniper'];
const tankOperators=new Set(['yuria','mia','leon','neris','livia']);
const sniperOperators=new Set(['arin','noel','serin','aurora']);
export const formationRole=(id:string):FormationRole=>tankOperators.has(id)?'tank':sniperOperators.has(id)?'sniper':'dealer';
export const formationRoleName:Record<FormationRole,string>={tank:'탱커',dealer:'딜러',sniper:'저격수'};
const formationOrder:Record<FormationRole,number>={tank:0,dealer:1,sniper:2};
const gradeOrder:Record<string,number>={B:0,A:1,S:2,SR:3};
export const formationSort=(a:{id:string;grade?:string;name?:string},b:{id:string;grade?:string;name?:string})=>formationOrder[formationRole(a.id)]-formationOrder[formationRole(b.id)]||(gradeOrder[a.grade??'']??9)-(gradeOrder[b.grade??'']??9)||(a.name??a.id).localeCompare(b.name??b.id,'ko');
export const formationComplete=(ids:string[])=>formationSlots.every((role,i)=>!!ids[i]&&formationRole(ids[i])===role)&&new Set(ids).size===5;
export function orderFormation(ids:string[]){const left=[...new Set(ids)];return formationSlots.map(role=>{const i=left.findIndex(id=>formationRole(id)===role);return i<0?'':left.splice(i,1)[0];}).filter(Boolean);}
export const dealerFirst=(a:{id:string},b:{id:string})=>Number(supportOperatorIds.has(a.id))-Number(supportOperatorIds.has(b.id));
export const combatRoles:Record<string,{kind:AttackKind;name:string;stages:string[]}>= {
 sera:{kind:'burst',name:'기관총',stages:['3발 연사','5발 연사','근접 확산탄','동일 대상 과열','8발 오버드라이브']},
 reina:{kind:'burst',name:'돌격 라이플',stages:['3점사','연사 가속','근접 확산탄','동일 대상 과열','8발 화염 탄막']},
 noel:{kind:'sniper',name:'대물 저격',stages:['조준 후 3명 관통','조준 단축','약점 추적','장갑 무시 강화','대물 피해 강화']},
 arin:{kind:'sniper',name:'레일건',stages:['조준 후 3명 관통','충전 단축','레일탄 강화','장갑 무시 강화','HORIZON BREAK 강화']},
 adela:{kind:'chain',name:'연쇄 번개',stages:['2명 전격','전이 거리 증가','4명 연쇄','전이 증폭','6명 연쇄']},
 theria:{kind:'chain',name:'폭풍 광선',stages:['3명 전격','광선 가속','5명 연쇄','폭풍 증폭','7명 폭풍']},
 aurora:{kind:'chain',name:'쌍극성 광선',stages:['물·전기 교차','젖음 확산','4명 연쇄','이온 증폭','이온 폭풍']},
 yuria:{kind:'melee',name:'수호 방벽',stages:['저지·피해 흡수','방벽 내구 증가','다수 저지','방벽 지속 강화','AEGIS TIDE']},
 karin:{kind:'melee',name:'다단 검격',stages:['2단 베기','속공','검격 강화','출혈 강화','5단 난무']},
 noxia:{kind:'melee',name:'심연 낫',stages:['넓은 낫 베기','약자 처형','범위 검격 강화','처형 강화','심연 집행']},
 arden:{kind:'melee',name:'흑염 검',stages:['화염 검격','검격 확장','흑염 검격 강화','처형','흑염 일식']},
 luna:{kind:'meteor',name:'운석 마법',stages:['낙하 암흑구','폭발 확대','운석 낙하','이중 운석','초신성']},
 belka:{kind:'shell',name:'소이 포격',stages:['포물선 포탄','소이 강화','폭발 확대','관통 파편','연쇄 폭발']},
 kairon:{kind:'shell',name:'화염 기폭포',stages:['화염 포격','폭발 확대','연소 기폭','파편 관통','연쇄 기폭']},
 neris:{kind:'water',name:'수류 요격벽',stages:['적 탄환 3회 차단','요격벽 지속 증가','탄환 4회 차단','수류 감속 강화','TIDAL INTERCEPT']},
 livia:{kind:'water',name:'빙결 수호갑',stages:['빙결 갑옷·구속','받는 피해 감소','구속 범위 증가','빙결 지속 강화','ABSOLUTE AEGIS']},
 ian:{kind:'drone',name:'공격 드론',stages:['1기 출격','비행 가속','2기 출격','폭발탄','4기 편대']},
 mia:{kind:'drone',name:'수호 드론망',stages:['보호막·긴급 수리','보호막 증가','주변 아군 수리','드론망 지속 강화','LIFELINE GUARD']},
 kyle:{kind:'drone',name:'중계 드론',stages:['전기 드론','중계 가속','2기 전이','전격 강화','중계 편대']},
 leon:{kind:'support',name:'도발 지휘망',stages:['광역 도발·피해 감소','지휘 지속 증가','아군 피해 감소','도발 범위 강화','RESONANCE COMMAND']},
 serin:{kind:'curse',name:'저주 광선',stages:['취약 저주','시전 가속','저주 전이','처형','광역 저주 강화']},
};
