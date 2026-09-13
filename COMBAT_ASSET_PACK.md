# Combat Asset Pack / Readability Update

## 적용 내용
- 빈 전투 슬롯 클릭 시 랜덤 소환 확인창 표시
- 확인 시 해당 슬롯 타입(any/melee/ranged)에 배치 가능한 덱 요원 중 랜덤 소환
- 대기석 요원을 선택한 상태에서는 기존처럼 빈 슬롯에 직접 배치
- 전투 캐릭터 21명 전원 160x160 / 동일 발 기준선 / 동일 시각 점유율로 정규화
- 21명 x 8프레임 공격 애니메이션, 12 FPS
- 영웅 표시 크기 118x118로 확대
- 가장 가까운 활성 적 방향으로 자동 좌우 반전
- 적 13종 런타임 박스 그래픽 대신 전용 PNG 에셋 사용
- 일반/중장/보스 크기 차등 적용
- B/A/S/SR 등급별 소환 링 에셋 및 실전 소환 연출 적용
- 빈 슬롯 + 표시 강화
- 불/물/전기/어둠 공통 projectile/impact/mark 에셋 추가
- ballistic/arcane/machine/melee 공통 보조 FX 추가

## 생성 에셋 위치
- `public/assets/combat/<hero>/frame_01..08.png`
- `public/assets/enemies/*.png`
- `public/assets/ui/summon_B.png`
- `public/assets/ui/summon_A.png`
- `public/assets/ui/summon_S.png`
- `public/assets/ui/summon_SR.png`
- `public/assets/ui/summon_slot.png`
- `public/assets/effects/common/*`

## 재생성
`python scripts/generate-combat-pack.py`

## 검증
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` 통과
- 현재 작업 환경에서는 업로드 ZIP의 node_modules가 Windows용 Rollup optional binary를 포함하고 있어 Vite 전체 번들 실행은 불가.
- 새 환경에서 `npm install` 후 `npm run build` 실행 권장.
