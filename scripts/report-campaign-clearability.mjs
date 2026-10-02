import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const files=['baseline','sweep','verify-sr1-growth','verify-tested-guide-growth','sweep-sHealer-max','sweep-sMixed-max','sweep-sCaster-max','sweep-sr1Damage-max','sweep-sr1Heal-max','sweep-sr1Leon-max','check-sMixed-max-manual'];
const audits=files.filter(id=>existsSync(`artifacts/campaign-clearability-${id}.json`)).map(id=>({id,...JSON.parse(readFileSync(`artifacts/campaign-clearability-${id}.json`,'utf8'))}));
const correction='artifacts/campaign-clearability-region12-tested-guide-growth.json';
if(existsSync(correction)){
 const revised=JSON.parse(readFileSync(correction,'utf8')),guide=audits.find(a=>a.id==='verify-tested-guide-growth');
 if(guide){guide.results=guide.results.filter(r=>!r.stage.startsWith('12-')).concat(revised.results);guide.revalidatedRegion={region:12,source:correction,reason:'The initial zero-SR example failed 12-5 with one seed; the mixed SR-tank example was revalidated for all ten area-12 stages.'};}
}
writeFileSync('docs/campaign-clearability-results-2026-10-01.json',JSON.stringify(audits,null,2)+'\n');
const matrix=audits.find(a=>a.id==='sweep');
const label={'starter-default':'기본 1성 · 지급 B+0','starter-weapon-B5':'기본 1성 · 지급 B+5','balanced-B0':'탱커 2 · 회복 1 · B+0','starter-growth':'시작 5명 · 지역별 성장','sOnly-growth':'S 탱커·S 딜러·A 서포터 · 지역별 성장','sr1-growth':'아스트라 SSR 1명 · 지역별 성장','sr2-growth':'SSR 2명 · 지역별 성장','sr3-growth':'SSR 3명 · 지역별 성장','sr5-growth':'SSR 5명 · 지역별 성장'};
const lines=['# 캠페인 기본 장비·성장·조합 검증 (2026-10-01)','',
'결론: 지급 B+0 무기, 1성 시작 5명, AUTO, 추천 배치는 3-9까지 연속 클리어하고 3-10에서 막힌다. 장비 강화만으로 끝까지 진행할 수 없다. 지역별 별 성장·장비·연구를 적용한 아스트라/리비아/테리아/엘리스/메리엘 편성은 160개 전 스테이지를 고정 시드 17/73/211, 60Hz 실제 전투 로직으로 검증했다.','',
'SR은 내부 데이터 등급이며 모집 화면에서는 SSR로 표시된다. 1명의 SSR로 가능한 조합을 찾았지만, 이것이 모든 조합의 필수 최소 개수라는 뜻은 아니다. SSR 회복 영웅만 교체하면 같은 성장에서도 일부 후반 보스를 넘기지 못했다.','',
'## 검사 조건','',
'- 기본 무기는 실제 지급되는 표준형 B+0 5개. 방어구·목걸이는 기본 지급만으로 모두 장착되는 것으로 가정하지 않았다. 테스트용 미장착 고등급 가방과 실제 장착 아이템을 분리했다.',
'- 비교 편성은 5명, 추천 자동 배치, AUTO 기준. 수동 비교는 게이지가 차면 즉시 수동 시전한 자동 입력이며 최적 타이밍 플레이를 증명하지 않는다.',
'- 렌더링 이펙트만 생략하고 적 AI, 저지, 피해, 발사체, 속성 반응, 회복, 쿨타임, 웨이브와 승패 로직은 그대로 실행했다.',
'- 폭넓은 조합 비교는 22개 체크포인트, 30Hz로 선별했다. 아래 주요 결과 중 전체 160개 검증과 체크포인트 검증을 구분한다.',
'- 전투별로 성장 조건을 준비했다. 실제 신규 계정의 모집·드랍 운이나 파밍 소요 시간까지 검증한 순차 경제 시뮬레이션은 아니다. 현재 테스트 버전은 모든 영웅을 보유한다.',
'- PC/Android/iPhone 브라우저에서 실제 배치·시작 버튼을 사용한 3-10 기본 편성 패배와 16-10 성장 편성 승리를 재현했다. 이후 전투는 60Hz로 시간만 빠르게 진행했다. 실물 휴대전화 수동 플레이는 아니다.','',
'## 같은 체크포인트의 비교','',
'| 조건 | 승리 / 22 | 최초 패배 체크포인트 |','|---|---:|---|'];
for(const profile of matrix.profiles.filter(p=>label[p.id])){
 const rows=matrix.results.filter(r=>r.profile===profile.id);
 lines.push(`| ${label[profile.id]} | ${rows.filter(r=>r.won).length} / ${rows.length} | ${rows.find(r=>!r.won)?.stage??'없음'} |`);
}
lines.push('','기본 장비의 160개 독립 테스트 중 일부 후속 스테이지의 승리는 해금 없이 건너뛰어 검사한 결과다. 실제 연속 진행 가능 범위는 최초 실패 직전까지인 3-9다. B+5 강화만 한 경우도 검사한 3-10 보스에서 실패했다. 별 2성·지급 B무기로는 3-10 통과 회귀 테스트가 별도로 있다.','',
'## 검증한 지역별 성장 예시','',
'| 지역 | 성급 | 장비 | 역할·속성 연구 |','|---|---:|---|---:|',
'| 1~2 | 1 | 지급 B+0 무기 | 0 |','| 3~4 | 2 | A+2, 무기·방어구·목걸이 | 1~2 |','| 5~6 | 3 | S+3, 3부위 | 3~4 |','| 7 | 4 | S+3, 3부위 | 5 |','| 8~11 | 5 | SSR+5, 3부위 | 6~9 |','| 12~16 | 5 | SSR+5, 3부위 | 10 |','',
'화면의 추천 편성 예시는 1~2지역 시작 5명, 3~4지역 유리아/네리스/세라/아린/레아, 5~11지역 가이아/리비아/테리아/엘리스/메리엘, 12~16지역 아스트라/리비아/테리아/엘리스/메리엘이다. 처음에는 12지역에도 가이아 조합을 제시했지만 12-5의 한 시드에서 실패하여, 12지역부터 후반 혼합 조합으로 수정하고 해당 지역 30전을 재검증했다.','',
'전체 클리어를 검증한 혼합 편성: 아스트라(SSR 탱커), 리비아(S 탱커), 테리아(S 딜러), 엘리스(S 저격수), 메리엘(A 서포터). 두 라인은 탱커를 분산하는 자동 배치를 쓴다. 지역별 성장 안내의 다른 예시 편성은 아래 전체 검증 결과를 함께 확인한다.','',
'강화는 실제 최대치 +5다. SSR 장비 1개를 +0→+5로 올리는 비용은 1,350C와 재료 20개, 15개 전체라면 20,250C와 재료 300개다. 장비 획득 비용은 별도다. 1→5성은 영웅당 조각 총 70개(5+10+20+35), 연구 0→10은 항목당 5,500C다. 영웅을 교체하면 그 영웅의 조각을 새로 모아야 하므로 기존 지역 반복 파밍이 필요할 수 있다.','',
'## 전체 160스테이지 검증','');
for(const id of ['verify-sr1-growth','verify-tested-guide-growth']){
 const audit=audits.find(a=>a.id===id);if(!audit){lines.push(`- ${id}: 아직 결과 파일 없음`);continue;}
 const rows=audit.results,last=rows.filter(r=>r.stage==='16-10');
 lines.push(`- ${id}: ${rows.filter(r=>r.won).length}/${rows.length} 승리. 16-10 코어 ${last.map(r=>r.core).join('/')}, 잔여 아군 HP ${last.map(r=>r.hpRemaining+'%').join('/')}, 전투 시간 ${last.map(r=>r.time+'초').join('/')}.`);
}
lines.push('','## 적용한 수정','',
'- 보호막은 스킬의 표시 지속시간 후 만료된다. 다시 시전해도 무한히 더해지지 않으며 더 강한 보호막을 유지한다. 약한 평타 보호막으로 큰 보호막의 만료 시각을 무한 연장하지 않는다.',
'- 소비 가능한 보유 조각 수에 붙어 있던 숨은 공격력 +0.5%/개 효과를 제거했다. 조각은 별 승급 재료로만 사용하며 기존 보유 수와 저장 기록은 유지한다.',
'- 권장 전투력은 실제 검증한 지역별 성장·장비·연구·역할 조합을 기준으로 계산한다. 스테이지 선택 화면에 성장 수준과 편성 예시를 표시한다.',
'- 무장비 시작 영웅이 특정 구간을 전부 이겨야 한다는 회귀 조건을 지급 B무기와 지역별 별 성장 조건으로 교체했다. 기본 1성의 3-10 패배와 성장 편성의 16-10 승리, 보호막 만료·비누적, 조각 보유량과 공격력 분리를 검사한다.',
'- 적의 체력·공격력은 이번 검사에서 일괄 낮추지 않았다. 클리어 가능한 성장 경로를 확인하고 보호막 버그와 잘못된 권장 기준을 수정했다.','',
'원자료: `docs/campaign-clearability-results-2026-10-01.json`. 재실행: `npx esbuild scripts/campaign-clearability.ts --bundle --platform=node --format=esm --outfile=artifacts/campaign-clearability.mjs`, 이후 `node artifacts/campaign-clearability.mjs baseline`, `sweep`, `verify sr1-growth`, `verify tested-guide-growth`.');
writeFileSync('docs/campaign-clearability-2026-10-01.md',lines.join('\n')+'\n');
console.log('Clearability report written: '+audits.reduce((n,a)=>n+a.results.length,0)+' recorded battles');
