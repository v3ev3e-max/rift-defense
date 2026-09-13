# 3V_TD: RIFT DEFENSE

Phaser 3 + TypeScript + Vite 기반 **PC/모바일 무한 랜덤 디펜스 RPG**입니다.

## 웹 테스트

**[GitHub Pages에서 RIFT DEFENSE 실행](https://v3ev3e-max.github.io/rift-defense/)**

- PC와 모바일 브라우저에서 같은 링크를 사용할 수 있습니다.
- 모바일에서는 브라우저 메뉴의 `홈 화면에 추가`를 사용하면 앱처럼 실행할 수 있습니다.
- `main` 브랜치가 갱신되면 GitHub Actions가 최신 빌드를 자동 배포합니다.

> 랜덤 소환 → 3합성 → 속성 반응/시너지 빌드 → 무한웨이브 최고 기록 도전

## 실행

Node.js 22.x 권장.

```bash
npm install
npm run dev
```

검증/빌드:

```bash
npm run build
npm test
```

GitHub Pages 정적 배포 대상이며 환경 변수와 백엔드는 필수가 아닙니다.

## 최신 핵심 규칙

- 무한 논스톱 웨이브
- 약 0.8초 웨이브 간격
- 5W 엘리트 / 10W 보스 / 보스 4종 순환
- 동일 영웅/동일 별 3개 → 1개 합성, 최대 ★5
- 4속성: 물 / 불 / 전기 / 어둠
- 6반응: 전도 / 과부하 / 증발 / 흑염 / 침식 / 공허 감전
- 총 21명: B10 / A5 / S4 / SR2
- 소환 확률: **B 86 / A 10 / S 3 / SR 1**
- 랜덤 소환 10G
- 확정 소환: B25 / A35 / S100 / SR250
- 모든 전투 시각 프레임은 12FPS 구조
- PC 120FPS 목표 / 모바일 60FPS 목표 / 전투 시뮬레이션 60Hz
- 동시 적 hard cap 48 + 기기별 하향 cap
- PC 좌우 광고 placeholder / 모바일 상하단 placeholder

## 영웅

### B
유리아 / 레이나 / 아린 / 카린 / 세라 / 노엘 / 루나 / 미아 / 이안 / 레온

### A
아델라 / 네리스 / 벨카 / **세린** / 카일

### S
리비아 / 카이론 / 테리아 / 녹시아

### SR
오로라(물+전기) / 아르덴(불+어둠)

## 주요 파일

- `src/data/heroes.ts` — 21명 영웅 데이터
- `src/data/balance.ts` — 소환 확률/성능 상수
- `src/data/waves.ts` — 무한웨이브 생성
- `src/systems/SummonSystem.ts` — 등급 우선 랜덤 소환
- `src/systems/ElementSystem.ts` — 속성 표식/반응
- `src/systems/CombatSystem.ts` — 고유 스킬/전투
- `src/systems/BattleModel.ts` — 게임 상태/경제/진행
- `src/game/BattleScene.ts` — Phaser 렌더링/FX
- `src/utils/performance.ts` — PC/모바일 동적 성능 제한

전체 현재 상태와 유지사항은 ZIP 상위 폴더의 `PROJECT_STATE.md`와 `CODEX_HANDOFF_PROMPT.md`를 반드시 참고하세요.
