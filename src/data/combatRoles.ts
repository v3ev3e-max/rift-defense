export type AttackKind='burst'|'sniper'|'chain'|'melee'|'meteor'|'shell'|'water'|'drone'|'support'|'curse';
export const supportOperatorIds=new Set(['rhea','echo','meriel','selene','ophilia']);
export type FormationRole='tank'|'dealer'|'sniper'|'support';
export const CAMPAIGN_SQUAD_CAP=5;
export const formationSlots:FormationRole[]=['tank','dealer','dealer','sniper','support'];
const tankOperators=new Set(['yuria','mia','leon','neris','livia','hana','gaia','astra']);
const sniperOperators=new Set(['arin','noel','serin','aurora','zion','elise','vera','celestia']);
const supportOperators=supportOperatorIds;
export const formationRole=(id:string):FormationRole=>tankOperators.has(id)?'tank':supportOperators.has(id)?'support':sniperOperators.has(id)?'sniper':'dealer';
export const formationRoleName:Record<FormationRole,string>={tank:'탱커',dealer:'딜러',sniper:'저격수',support:'서포터'};
const formationOrder:Record<FormationRole,number>={tank:0,dealer:1,sniper:2,support:3};
const gradeOrder:Record<string,number>={B:0,A:1,S:2,SR:3};
export const formationSort=(a:{id:string;grade?:string;name?:string},b:{id:string;grade?:string;name?:string})=>formationOrder[formationRole(a.id)]-formationOrder[formationRole(b.id)]||(gradeOrder[a.grade??'']??9)-(gradeOrder[b.grade??'']??9)||(a.name??a.id).localeCompare(b.name??b.id,'ko');
export const formationComplete=(ids:string[])=>ids.length>=1&&ids.length<=CAMPAIGN_SQUAD_CAP&&new Set(ids).size===ids.length;
export function orderFormation(ids:string[]){return [...new Set(ids)].sort((a,b)=>formationSort({id:a,grade:heroGrade(a),name:a},{id:b,grade:heroGrade(b),name:b}));}
const heroGrades:Record<string,string>={yuria:'B',reina:'B',arin:'B',karin:'B',sera:'B',noel:'B',luna:'B',ian:'B',mia:'B',rhea:'B',echo:'B',adela:'A',neris:'A',belka:'A',serin:'A',kyle:'A',hana:'A',zion:'A',meriel:'A',livia:'S',kairon:'S',theria:'S',noxia:'S',gaia:'S',elise:'S',vera:'S',selene:'S',leon:'SR',arden:'SR',aurora:'SR',astra:'SR',solara:'SR',celestia:'SR',ophilia:'SR'};
const heroGrade=(id:string)=>heroGrades[id]??'';
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
 neris:{kind:'melee',name:'수류 방패창',stages:['방패창 근접 타격','요격벽 지속 증가','탄환 4회 차단','수류 반격 강화','TIDAL INTERCEPT']},
 livia:{kind:'melee',name:'빙결 장벽술',stages:['근거리 빙결파·구속','받는 피해 감소','빙결파 범위 증가','빙결 지속 강화','ABSOLUTE AEGIS']},
 ian:{kind:'drone',name:'공격 드론',stages:['1기 출격','비행 가속','2기 출격','폭발탄','4기 편대']},
 mia:{kind:'melee',name:'나노 방벽술',stages:['나노 코어 충격파','투영 방벽 증가','주변 아군 수리','나노 방벽 지속 강화','LIFELINE GUARD']},
 kyle:{kind:'drone',name:'중계 드론',stages:['전기 드론','중계 가속','2기 전이','전격 강화','중계 편대']},
 leon:{kind:'melee',name:'공명 지휘술',stages:['근거리 공명 충격','지휘 지속 증가','아군 피해 감소','도발 범위 강화','RESONANCE COMMAND']},
 hana:{kind:'melee',name:'수류 방패철퇴',stages:['방패철퇴','수류 방벽','투사체 차단','방벽 강화','TIDAL BASTION']},
 zion:{kind:'sniper',name:'열선 저격',stages:['3명 관통','조준 단축','연소 약점','장갑 관통','RED SIGHT']},
 gaia:{kind:'melee',name:'전격 창방패',stages:['창방패 타격','전격 반격','광역 충격','감전 전이','VOLT AEGIS']},
 elise:{kind:'sniper',name:'빙결 저격',stages:['3명 관통','빙결 탄환','약점 추적','관통 강화','WHITE TRACE']},
 vera:{kind:'sniper',name:'공허 석궁',stages:['3명 관통','취약 저주','처형','관통 강화','NIGHT BOLT']},
 astra:{kind:'melee',name:'균열 대방패',stages:['대방패 타격','전역 보호','공허 반격','강제 도발','DARK CITADEL']},
 solara:{kind:'chain',name:'플라즈마 전이',stages:['3명 전이','전이 가속','과부하','전이 강화','HELIO ARRAY']},
 celestia:{kind:'sniper',name:'대균열 저격',stages:['5명 관통','조준 단축','보스 집중','장갑 무시','EVENT LANCE']},
 serin:{kind:'curse',name:'저주 광선',stages:['취약 저주','시전 가속','저주 전이','처형','광역 저주 강화']},
 rhea:{kind:'support',name:'수류 의료 파동',stages:['단일 회복','회복량 증가','범위 회복','보호막 추가','LIFELINE BLOOM']},
 echo:{kind:'support',name:'전술 가속 드론',stages:['재사용 가속','충전 지원','범위 확대','과충전','TEMPO LINK']},
 meriel:{kind:'support',name:'화염 수호 성가',stages:['보호막 부여','상태 해제','피해 증폭','전군 보호','EMBER CHOIR']},
 selene:{kind:'support',name:'월식 저주진',stages:['취약 부여','회복 파동','저주 전이','방어 약화','ECLIPSE HYMN']},
 ophilia:{kind:'support',name:'성역 공명',stages:['전군 회복','전군 보호막','상태 해제','스킬 충전','CELESTIAL SANCTUM']},
};
