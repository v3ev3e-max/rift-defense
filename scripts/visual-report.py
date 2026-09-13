from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'artifacts/visual-audit'
data=json.loads((out/'final-measurements.json').read_text());rows=data['measurements']
before=json.loads((out/'before.json').read_text());after=json.loads((out/'after.json').read_text())
prepared=json.loads((out/'prepared.json').read_text())
hero=[r for r in rows if r['kind']=='hero'];foot=[r['foot'] for r in hero]
md=['# RIFT DEFENSE 시각 자산 검수','',
'21명 전원의 SD 공격 프레임과 전투 효과를 재생성하고 원본 및 렌더링 처리를 수정했습니다. 배포·외부 게시를 하지 않았습니다. 기존 초상화·능력·확률·밸런스·저장 형식은 이번 시각 수정의 변경 대상이 아닙니다.',
'', '## 자산과 허용 오차','',
'- 내장 image_gen으로 생성한 최종 시트 42개(영웅 21 + 효과 21)를 프로젝트에 복사했습니다. CLI/API 우회 생성은 사용하지 않았습니다.',
'- 21명 모두 frame_01~03 160×160, projectile_01~03 384×128, impact_01~03 256×256, skill 384×384 투명 PNG입니다. 유리아 barrier 384×384도 유지·갱신했습니다.',
'- 최종 파일: 전투용 210개 + 정적 SD 21개 + 기존 호환 impact 5개 + barrier 1개 = 237개. 초상화와 사용하지 않는 옛 eve/lize 정적 파일은 유지했습니다.',
f'- 실루엣 높이 허용 82~95px, 측정 {min(r["content"][1] for r in hero)}~{max(r["content"][1] for r in hero)}px. 무기·머리 장식·발광까지 포함한 값이며 해부학적 몸통 높이와 동일한 측정은 아닙니다.',
f'- 발 중심 허용 x=80±4px / 프레임 간 이동 ≤4px, y 프레임 간 이동 ≤2px. 측정 x={min(p[0] for p in foot)}~{max(p[0] for p in foot)}, y={min(p[1] for p in foot)}~{max(p[1] for p in foot)}.',
'- 불투명 영역 검사 기준 alpha>8, 최소 6px 안전 여백. 프레임마다 실루엣을 찌그러뜨리지 않고, 영웅 한 명의 3프레임에 동일 배율을 적용합니다.',
f'- 수정 전 {sum(r["edge"] for r in before)}개 파일이 가장자리에 닿았습니다. 수정 후 현재 사용 자산에서는 0개입니다. 전체 폴더의 남은 2개는 미사용 eve.png/lize.png입니다.',
'', '## 구현','',
'- src/game/VisualRules.ts: 12FPS 시계, 21명별 총탄/명중/스킬 표시 크기, 회전 사각형 경계 계산.',
'- src/systems/BattleModel.ts: 효과 최소 수명 0.25초. 효과 시간은 실제 시간으로 감소하고 x2 시뮬레이션 시간과 분리됩니다. 일시정지·보상 중에는 정지합니다.',
'- src/game/BattleScene.ts: 1→2→3 공격 동작은 83.33ms 간격, 0.25초 동안 표시합니다. 총탄도 같은 시간 기준을 사용합니다. 높은 공격 속도에서도 진행 중인 동작을 첫 프레임으로 반복 초기화하지 않습니다.',
'- 영웅 캔버스 표시 크기는 84×84, 원본 발 앵커 (80,142), 배치 위치 (unit.x,unit.y+16)입니다. HP는 y−42, 별은 y+25입니다.',
'- 총탄 너비는 영웅별 48~84 게임 좌표 단위, 높이는 너비×원본높이/원본너비입니다. 이동 거리는 크기에 영향을 주지 않습니다.',
'- 회전 후 외곽 크기 w|cosθ|+h|sinθ|, w|sinθ|+h|cosθ|로 화면 경계를 계산합니다. 피해 위치를 변경하지 않고 시각 중심만 안쪽으로 보정합니다. 일반 반응 원에도 경계 보정을 적용합니다.',
'- 풀 재사용 시 가시성·알파·회전·색조·배율을 초기화합니다. 영웅·적 위에 효과, HP·표식은 그 위에 표시합니다.',
'- 적 상한 PC48/모바일34/저사양PC36/저사양모바일28, 효과 풀64, 60Hz 시뮬레이션, 렌더링 목표 PC120/모바일60 설정은 유지했습니다. 군중 상황에는 표시 효과 수만 줄입니다.',
'', '## 실제 검사','',
'- 깨끗한 의존성 설치: 기존 node_modules를 작업 폴더 내 백업으로 옮긴 후 npm ci 성공.',
'- npm test: 51개 통과. 30/60/120 렌더 간격에서 3프레임과 x1/x2 실제 시간 기준, 64개 효과 풀 포화 전후 42적 피해 결과가 동일함을 검사합니다.',
'- npm run build: 성공. Phaser 번들 크기 경고는 남아 있으나 빌드 오류는 없습니다.',
'- npm run test:e2e: 72개 통과(PC Chromium, Android 세로 Chromium, iPhone 세로 WebKit). 일반 플레이·드래그/탭·합성·전술·저장 및 42적 스트레스 포함.',
'- 마지막 색상 보정 및 WebKit 화면 캡처 방식 수정 후 e2e/visuals.spec.ts 63개 재검사도 모두 통과했습니다. 최신 전투 스크린샷 63장을 저장했습니다.',
'- scripts/check-visuals.py: 21명×10개=210개 검사 통과. 최종 원본 수치 아래 표 참조.',
'- npm run build:local: 275개 자산 포함, local-test/index.html 최신 갱신.',
'- scripts/verify-local-visuals.mjs: 루트 및 local-test 직접 열기 각각 21명, 총42회 소환/캔버스와 포함 이미지 디코딩 검사 통과. 배포용 빌드에는 개발 디버그 객체가 없어 실제 텍스처 키 검사는 개발 브라우저 63개 시나리오에서 수행했습니다.',
'- 21명별 실제 attack 함수를 30회 호출하여 스킬·속성 반응 발생, 텍스처 존재, 3프레임 순서, 원본/표시 비율, 포털·중앙·코어 및 모서리 경계를 검사했습니다. 프레임 경계는 시간 값을 통제한 장면으로 검사합니다.',
'', '## 검수 화면과 기록','',
'- artifacts/visual-audit/after-{영웅ID}-dark.png 및 light.png: 영웅별 10개 이미지 비교, 총42장.',
'- artifacts/visual-audit/combat-{desktop-chromium|android-portrait|iphone-webkit}-{영웅ID}.png: 전투 63장.',
'- artifacts/visual-audit/direct-index.html.png 및 direct-local-test-index.html.png: 직접 실행 화면.',
'- artifacts/visual-audit/prepared.json: 최종42시트의 생성 프롬프트·원본 출처·후처리 버전.',
'- artifacts/visual-sources/: 생성 원본. artifacts/visual-backup/: 교체 전 원본. before.json/after.json: 전체 측정.',
'', '## 수동 확인이 필요한 범위','',
'실기기 Android/iPhone GPU·발열·배터리·장시간 플레이 성능은 측정하지 않았습니다. 화면 재생률보다 낮은 실제 FPS에서는 모든 83.33ms 구간이 물리적으로 표시된다고 보장할 수 없습니다. 공격 중 무기·머리카락 형태의 자연스러운 변화와 주관적인 연출 선호는 직접 플레이로 최종 판단해야 합니다. 검수는 원본 알파 경계·표시 비율·통제된 프레임/효과 장면에 대한 검증이며 모든 플레이 조합이 완벽하다는 주장은 하지 않습니다.',
'', '## 이미지별 최종 측정','',
'좌표는 원본 픽셀입니다. bounds는 [left,top,right,bottom]이며 right/bottom은 배타적입니다.','',
'| 영웅 | 종류/프레임 | 캔버스 | 불투명 크기 | bounds | 중심 | 발 |',
'|---|---|---|---|---|---|---|']
for r in rows:
    md.append(f'|{r["id"]}|{r["kind"]}/{r["frame"]}|{r["size"]}|{r["content"]}|{r["bounds"]}|{r["center"]}|{r["foot"] or "—"}|')
md+=['','## 최종 생성 시트 목록','', '| 영웅 | 종류 | 프로젝트 원본 |','|---|---|---|']
for p in sorted(prepared,key=lambda p:(p['id'],p['kind'])):md.append(f'|{p["id"]}|{p["kind"]}|{p["source"]}|')
(ROOT/'VISUAL_VERIFICATION.md').write_text('\n'.join(md)+'\n',encoding='utf8')
print('VISUAL_VERIFICATION.md written')
