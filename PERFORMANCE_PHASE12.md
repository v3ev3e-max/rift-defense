# Phase 12 — Runtime Asset / Endless Wave Performance Pass

이번 단계는 게임 규칙과 데미지 계산을 바꾸지 않고, PC/모바일 무한웨이브에서의 로딩/렌더링 부담을 줄이는 최적화 패스입니다.

## 적용 내용
- 전투용 대형 PNG 런타임 에셋 최적화
  - `public/assets` 약 49MB → 약 9.2MB
  - 큰 SD fallback 이미지는 최대 256×256
  - 초기 5명 대형 projectile는 최대 512×192
  - 초기 5명 impact/barrier는 최대 384×384
  - PNG portrait는 최대 576×768
- 전투 애니메이션/FX는 현재 덱에 포함된 영웅만 preload
  - 모든 10명의 12FPS 프레임과 이펙트를 매 전투마다 전부 로딩하지 않음
  - 작은 static fallback만 전체 영웅에 유지
- FX sprite pool을 기기 성능 프로필에 맞게 생성
  - 데스크톱: 기본 64
  - 모바일/저사양/수동 저효과 설정은 더 작은 pool
- 무한웨이브 군집 선제 보호
  - 동시 적 24+: 시각 FX 최대 36
  - 동시 적 32+: 시각 FX 최대 24
  - 동시 적 40+: 시각 FX 최대 16
  - 데미지/판정/웨이브 로직은 그대로 유지
- 기존 FPS 기반 adaptive effect cap과 함께 동작

## 검증
- 10명 영웅의 3프레임 전투 SD 존재 확인
- 10명 영웅의 projectile 3프레임 존재 확인
- 10명 영웅의 impact/skill 구조 존재 확인
- 누락 에셋 0개
- src TypeScript 29개 파일 transpile syntax 검사: 오류 0개

## 목적
고웨이브에서 몬스터 수가 상한까지 차더라도 게임 로직은 유지하면서, 브라우저의 이미지 디코딩 메모리와 FX draw call이 갑자기 증가하는 상황을 줄입니다.
