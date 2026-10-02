# 모집 프레임 애니메이션 제작

내장 image_gen으로 6개 시퀀스를 각각 생성했다. 각 8프레임, 총 48개의 서로 다른 그림이다. 정지 이미지의 CSS 확대·점멸·rotateY 애니메이션은 모집 화면에서 비활성화했다. Bootstrap은 사용하지 않는다.

최종 원본: `art-source/recruit-animation/{sequence}.png`.
최종 런타임: `public/assets/ui/recruit/animations/{sequence}/frame_01.webp` ~ `frame_08.webp`.
재생기: `src/ui/RecruitSpritePlayer.ts`. requestAnimationFrame으로 실제 WebP 프레임을 교체한다.

공통 생성 조건: stylized-concept, painted anime sci-fi fantasy game sprite sheet; 4 columns × 2 rows, row-major 8 different chronological frames, genuine transparent background, fixed center/camera, no text/characters/watermark. 최초 경계 침범 시트는 폐기하고 넓은 여백으로 다시 생성했다. 프레임은 같은 시트 전체에 동일한 배율을 사용하여 기계적으로 분리·패킹했다. 그림을 코드로 만들거나 기존 이미지를 복사하여 프레임 수를 채우지 않았다.

## arrival

8-frame cyan materialization: a little blue dimensional spark becomes a circular portal; blue crystal shards spiral together into an ornate closed navy/silver/cyan recruitment card matching reference1; last frame shows complete stationary sealed card. Frames: spark, thin portal, bright portal, outline card, partial materialization, almost complete card, settled sparks, complete card.

## turn

Retry layout constraints: 8-frame CONTACT SHEET; four columns × two rows equal square cells. Each drawing central 50% only; wide empty transparent gutters. No background haze. A SMALL navy cyan silver ornate card rotates in 8 chronological angles: back face 0deg,25deg,50deg,75deg,90deg edge-on,115deg empty front,150deg empty front,180deg empty front. Keep every card identical shape and same vertical height. No extra swirling effects. Empty front interior for a portrait later. Fixed camera.

## sr-charge

Retry layout constraints: 8-frame CONTACT SHEET; four columns × two rows equal square cells. Each drawing central 50% only; wide empty transparent gutters. No background haze. A SMALL GOLD bordered ornate navy recruitment card remains fixed in all 8 cells. Distinct golden streak travels around border clockwise and sparks change positions progressively. First quiet amber crystal, frames2-6 streak travels,frame7 charge,frame8 warm golden afterglow. GOLD ONLY not purple/cyan, no cracks, no prism.

## ssr-crack

Retry layout constraints: 8-frame CONTACT SHEET; four columns × two rows equal square cells. Each drawing central 50% only; wide empty transparent gutters. No background haze. A SMALL GOLD bordered navy recruitment card. Eight frames thin violet fissure appears and incrementally branches; rainbow light leaks; central crystal fractures; tiny shards separate;dimensional opening stabilizes. Card stays same size/position. Shards MUST stay close to card, no vast outward explosions.

## sr-reveal

Use case: stylized-concept. Asset type: animation sprite sheet 8 DIFFERENT stages of GOLD circular summoning magic, 4 columns x 2 rows evenly spaced square cells. Make every effect TINY: outer radius only 15% of cell width. A LOT of empty transparent canvas between effects. All 8 rings same center and same maximum outer radius, no expanding ovals. Frame1 thin golden circle; frame2 adds arcs;frame3 ornate runes;frame4 eight gold rays;frame5 twelve gold star particles;frame6 swirling gold ribbon;frame7 scattered gold sparks;frame8 subdued gold complete ring. Every shape and light confined to a small circle. Warm GOLD ONLY. Center empty transparent; outside fully transparent; no black or white backdrop, no text, no labels, no characters. Hand-painted detailed fantasy game effects. No rainbow/prism. NEVER touch neighboring cells or canvas edges.

## ssr-reveal

8-frame SSR dimensional rift effect matching reference2 style. Empty transparent center for hero overlay. Thin jagged luminous slit, slit splits, branching iridescent fractures, crystalline rift opens, rainbow shards erupt, gold ornate ring stabilizes, cyan violet light swirls with dispersing shards, quiet prism afterglow. Every frame distinctly evolves, no merely copied rings. Important: whole rift and all shards entirely inside each cell safe margins.

## 동작과 검사

- 출현 560ms, 70ms 간격으로 10장 재생. 전체 정렬 종료 전 등급 예고 없음.
- 일반 카드 대기는 출현 마지막 프레임을 고정 유지한다.
- SR 광택 1600ms 반복; SSR은 황금 예고 700ms 후 균열 1200ms 1회 재생, 마지막 프레임 유지.
- 뒤집기 400ms 1회 재생 후 결과 공개. 고티어 공개 FX는 3000ms 8프레임 1회 재생.
- 모션 감소 설정은 마지막 프레임만 표시한다. 공개 시간과 보상은 그대로 유지.
- 닫기/건너뛰기/화면 전환에서 타이머·RAF를 취소하고 배경 스크롤을 복원한다.
- 모든 WebP는 RGBA 512×512, 외곽 32px 안전 여백. 픽셀 검사: 48개 해시 모두 다름, 외곽 24px 완전 투명. 원본 경계 알파 24 초과는 패킹 거부.

실행: `python scripts/pack-recruit-animation.py`, `python scripts/test-recruit-art.py`, `npx vitest run tests/recruit.test.ts tests/recruit-sprite.test.ts`, `npx playwright test e2e/recruit-reveal.spec.ts e2e/recruit.spec.ts`, `npm run build`, `npm run build:local`.

영웅 본체의 새로운 캐릭터 애니메이션을 생성한 작업은 아니다. 기존 일러스트 위의 모집 전용 출현·카드·공개 효과를 프레임 제작했다. GitHub 배포하지 않음.

