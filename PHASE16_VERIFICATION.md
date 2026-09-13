# Phase 16 검증 기록 — 2026-09-07

## 기준
인수인계 첨부와 루트 PHASE16_S_SR_EXPANSION.md 및 실제 소스를 기준으로 검증했다. 전달본은 game/ 하위가 아닌 프로젝트 루트에 있으며 PROJECT_STATE.md는 없었다. 기존 사용자 변경은 유지했다. 배포·업로드하지 않았다.

## 이번 작업에서 수정한 파일
- src/game/BattleScene.ts: 기존 15명 고정 목록 때문에 S/SR 이펙트가 표시되지 않는 문제를 현재 로드된 영웅 집합 기준으로 수정.
- src/style.css: 스테이지 장식용 tactical-grid의 절대 위치와 회전이 전술창에도 적용되는 선택자 충돌 수정.
- src/main.ts: 연구 후 선택 영웅 유지. S/SR 비용과 맞지 않는 확정 소환 버튼의 25~35 표기 제거(선택창의 실제 비용은 유지).
- scripts/build-local.mjs: 최신 이미지/이펙트 255개를 자동 포함하고 루트 HTML의 광고/앱 구조를 보존하는 단일 HTML 생성.
- tests/battle.test.ts: 21명 및 SR 등급 기대값, 속성 조건에 맞는 연구 효과 테스트 수정.
- tests/phase16.test.ts: 등급 확률, 누락 등급 정규화, SR 교대 속성/반응, 반응 제한, 확정 비용, 무한 웨이브 계약 검사 추가.
- e2e/game.spec.ts: 최신 21명/무한 전투/전술창에 맞춰 브라우저 검사 갱신. 장면 로딩 대기도 수정.
- scripts/verify-local-phase16.mjs: file:// 직접 실행 확인.
- .gitignore: 보존한 이전 node_modules 폴더 제외.
- package-lock.json: 의존성 재설치에 따른 갱신.
- PHASE16_VERIFICATION.md: 본 기록.
생성물: dist/, local-test/index.html, artifacts/phase16-*.png. 전체 git 변경 목록에는 전달받은 소스 변경도 포함되므로 이를 모두 이번 수정으로 간주하면 안 된다.

## 실행 결과
- 기존 node_modules를 node_modules.pre-phase16로 보존한 뒤 npm install: 성공, 57개 설치, 취약점 0. Node 24.18.0 사용.
- npm run build: 성공. Phaser 묶음이 500KB를 초과하는 경고는 남아 있음. 오프라인 캐시 264파일 생성.
- npm test: 43/43 통과. 초기 실패 4개는 구버전 테스트 기대값과 속성 조건 불일치였음.
- 10만 회 등급 추첨: B 86,031 / A 9,922 / S 3,045 / SR 1,002. 21명 덱과 등급별 1명 덱 결과 동일. B/A 덱 정규화도 통과.
- npm run test:e2e: 9/9 통과. desktop Chromium, Android 세로 에뮬레이션, iPhone WebKit 세로 에뮬레이션.
- 브라우저에서 영웅 이미지, 덱 저장, 자동 시작, 이동/합성, 연구 선택 유지, 보상 정지, 종료 저장, 반응형 광고 영역 검증.
- SR 텍스처 렌더링 및 42적의 합성 부하 상황에서 이펙트 상한 14 이하/적 42 유지 확인. 정상 적 생성 제한과 구분한 테스트임.
- npm run build:local: 성공. node scripts/verify-local-phase16.mjs: 직접 HTML 실행, canvas 1개, JS 오류/깨진 DOM 이미지 0개. 세로 화면 캡처 확인.

## 검증 범위와 남은 수동 확인
- W31/50/100 이후 정의와 적 ID, 보스 순환 및 W31→32 자동 전환은 자동 검사했다. 실제 전투를 W100까지 장시간 연속 완주한 검증은 하지 않았다.
- 실물 Android/iPhone 장시간 발열, 배터리, 저사양 기기의 지속 FPS는 기기가 없어 검증하지 않았다. 40+적 검사는 인위적인 낮은 프레임 간격으로 FX 제어를 검사한 것이며 실기 성능 수치가 아니다.
- Node 22에서 별도 재실행하지 않았다.
- 직접 HTML 검사는 Chromium 기준이다. 모바일 파일 앱의 HTML 실행 및 file:// 저장 유지 정책은 브라우저마다 달라 별도 확인이 필요하다.
- 수동으로 local-test/index.html을 열고 소환/합성/연구, 종료 후 저장, PC 창 폭 변경과 휴대폰 세로 터치, 장시간 웨이브를 확인하면 된다.
- 수치와 전투 규칙은 임의 변경하지 않았다. 실제 광고 SDK는 추가하지 않았다.
