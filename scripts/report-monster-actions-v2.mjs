import {build} from 'esbuild';
import {readFileSync,writeFileSync} from 'node:fs';
await build({stdin:{contents:`export {enemies} from './src/data/enemies'; export {campaignStages,campaignEnemyIds,campaignRegion} from './src/data/campaign'; export {monsterActionOwner,monsterActionOwners} from './src/game/MonsterActionAssets';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'artifacts/monster-actions-v2/report-catalog.mjs'});
const {enemies,campaignStages,campaignEnemyIds,campaignRegion,monsterActionOwner,monsterActionOwners}=await import('../artifacts/monster-actions-v2/report-catalog.mjs');
const source=readFileSync('src/game/RegionalEnemyArt.ts','utf8'),regional={};
for(const match of source.matchAll(/(\d+):new Set\(\[([^\]]+)\]\)/g))regional[Number(match[1])]=new Set([...match[2].matchAll(/'([^']+)'/g)].map(m=>m[1]));
const contexts={};
for(const stage of campaignStages){const area=campaignRegion(stage);for(const id of campaignEnemyIds(stage)){
 const def=enemies[id],visual=def.visualId??id,artArea=area>12&&def.visualId?area-4:area,isRegional=regional[artArea]?.has(visual)&&visual!=='elite';
 (contexts[id]??=new Map()).set(area,{area,owner:monsterActionOwner(id,def.visualId,artArea,!!isRegional)});
}}
const inventory=JSON.parse(readFileSync('artifacts/animation-inventory/catalog.json','utf8'));
const validation=JSON.parse(readFileSync('artifacts/monster-actions-v2/pixel-validation.json','utf8'));
const rows=Object.values(enemies).map(e=>({id:e.id,name:e.name,classicOwner:monsterActionOwner(e.id,e.visualId),campaign:[...(contexts[e.id]?.values()??[])],complete:!!monsterActionOwner(e.id,e.visualId)&&[...(contexts[e.id]?.values()??[])].every(c=>c.owner)}));
const targets={attack:inventory.enemies.filter(e=>!e.attack&&!e.fire).map(e=>e.id),hit:Object.keys(enemies),death:inventory.enemies.filter(e=>!e.death).map(e=>e.id)};
const results=Object.fromEntries(Object.entries(targets).map(([state,ids])=>[state,{total:ids.length,complete:ids.filter(id=>rows.find(r=>r.id===id)?.complete).length,pending:ids.filter(id=>!rows.find(r=>r.id===id)?.complete)}]));
const summary={definitions:rows.length,registeredVisualOwners:monsterActionOwners.size,frames:validation.reduce((n,r)=>n+r.frames,0),summons:validation.filter(r=>r.type==='summon').length,results,rows};
writeFileSync('artifacts/monster-actions-v2/progress.json',JSON.stringify(summary,null,2));
const lines=['# 몬스터 모션 제작·연결 진행 보고 (2026-10-02)','',`적 정의 ${rows.length}개. 현재 등록된 몬스터 시각 자산 ${monsterActionOwners.size}종, 소환체 ${summary.summons}종. 신규 픽셀 검사 통과 프레임 ${summary.frames}장.`, '', '| 요청 | 모든 사용 지역까지 연결 완료 | 전체 대상 |','|---|---:|---:|',...Object.entries(results).map(([state,result])=>`| ${state} | ${result.complete} | ${result.total} |`),'', '지역별 외형이 다른 경우 공통 자산으로 대체하지 않습니다. 기존 데이터의 visualId 별칭 또는 정확히 같은 원본 경로인 경우에만 기존 디자인 소유 관계를 유지합니다.','', '## 미완료 적 정의','',...rows.filter(r=>!r.complete).map(r=>`- ${r.name} (${r.id}): 공통 ${r.classicOwner?'연결':'미완료'}; 지역 미완료 ${r.campaign.filter(c=>!c.owner).map(c=>c.area).join(', ')||'없음'}`),'', '## 제작·검증 방법','', '- 내장 이미지 생성 도구로 각 시각 자산의 준비→접촉→회복, 피격 3장, 사망 3장을 각각 새로 그림. 원본 art-source/monster-actions-v2, 런타임 public/assets/generated/monster-actions-v2.', '- 소환체 5종은 이동·공격·피격·사망 각 3장. 런타임 public/assets/generated/raid-summon-actions-v2.', '- 원본 투명 구분선 및 경계, 출력 256×256/공통 축척/고정 바닥 앵커/24px 이상 여백, 디코딩 후 픽셀 해시 중복 검사. 잘린 생성본은 등록하지 않고 재생성.', '- 생성 프롬프트는 자산별 *-prompt-*.json 및 전체 작업 프롬프트에 기록.', '- 공격은 실제 공격/발사/능력 발동 시각으로, 피격은 실제 HP 감소로, 사망은 기존 사망 사건으로 유한 재생. 소환체 공격은 보스 공격 사건에 동기화하며 임의 반복 공격 타이머는 사용하지 않음.', '- PC/모바일 테스트는 Playwright 에뮬레이션. 실제 휴대폰 확인 결과가 아님.', '- 전체 제작·지역별 실전 검사·빌드가 끝나기 전에는 전체 완료로 보고하지 않음.'];
writeFileSync('docs/monster-actions-v2-2026-10-02.md',lines.join('\n')+'\n');
console.log(JSON.stringify({...summary,rows:undefined}));
