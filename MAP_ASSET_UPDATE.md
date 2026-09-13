# 맵 배경 에셋 연결

사용자가 지적한 화면에는 맵 이미지 로딩 코드가 없고 임시 격자·사각 건물만 있었습니다. 캐릭터 에셋 검수와 별개로 빠져 있던 맵 아트를 추가했습니다.

- 신규 원본: `public/assets/maps/rift-courtyard.png` — 내장 image_gen으로 생성한 산업 도시 바닥·발전 설비·배수구·케이블 배경.
- 생성 프롬프트와 원본 경로: `artifacts/visual-audit/map-generation.json`.
- `src/game/BattleScene.ts`: 배경을 로드하여 게임 도로·슬롯 아래에 배치. 임시 격자와 사각 건물 제거. 이동 좌표, 슬롯 좌표, 밸런스는 유지.
- `local-test/index.html`: 276개 자산을 포함하도록 재빌드. 루트 index.html 직접 열기 시 최신 실행판으로 연결됨을 확인.
- 웹 빌드 및 단일 HTML 빌드 성공. 직접 실행에서 브라우저 오류·누락 이미지 없음.
- 맵 텍스처 존재뿐 아니라 표시 중인 배경 객체의 크기·깊이도 브라우저에서 검사. PC/Android/iPhone 기본 플레이 회귀 검사에 포함.
- 배포하지 않음.

스크린샷: `artifacts/phase16-desktop-chromium-battle.png`, `artifacts/phase16-android-portrait-battle.png`, `artifacts/phase16-iphone-webkit-battle.png`.
