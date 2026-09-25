import type {SaveData} from '../data/types';
import {button,num} from './components';

const modes=[
 ['∞','무한 방어전','끝없이 강화되는 적을 상대하고 최고 웨이브를 갱신합니다.','ops-infinite','즉시 출전'],
 ['◆','속성 균열','요일 속성에 맞춰 목걸이와 요원 조합을 변경하는 작전입니다.','ops-rift','균열 선택'],
 ['★','영웅 개인 작전','지정 영웅 중심의 편성과 전용 장비 획득에 도전합니다.','ops-hero','요원 편성'],
 ['Ⅲ','보스 연속 토벌','주간 보스 3종을 같은 편성으로 이어서 공략합니다.','ops-rush','토벌 준비'],
 ['!','제약 작전','등급·역할·AUTO 제한 조건으로 추가 보상을 획득합니다.','ops-constraint','제약 편성'],
 ['2/3','장비 세트','보스 장비 조합과 역할별 세트 효과를 구성합니다.','ops-sets','장비 관리'],
 ['◎','월드 보스','전체 누적 피해 목표에 참여하고 단계 보상을 획득합니다.','ops-world','월드 보스'],
 ['H','고난도 세계선','기존 지역의 강화 패턴과 상위 보상에 도전합니다.','ops-hard','세계선 선택'],
] as const;

export function operationsScreen(s:SaveData){
 const element=['수류','화염','전격','암흑'][new Date().getDay()%4];
 return `<section class="operations-screen"><header><span class="eyebrow">SPECIAL OPERATIONS</span><h1>특수 작전</h1><p>캠페인 편성·성장·장비를 그대로 사용하는 순환 콘텐츠입니다.</p><div><span>오늘의 균열 <b>${element}</b></span><span>최고 웨이브 <b>${s.bestWave}</b></span><span>주간 레이드 피해 <b>${num(s.raid.weeklyDamage)}</b></span></div></header><div class="operations-grid">${modes.map(([mark,name,text,action,label],i)=>`<article class="operation-card op-${i+1}"><i>${mark}</i><span><small>${i<4?'ACTIVE OPERATION':'TACTICAL SYSTEM'}</small><h2>${name}</h2><p>${text}</p>${button(label,action,i===0?'primary':'ghost')}</span></article>`).join('')}</div></section>`;
}
