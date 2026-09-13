# 청록 연구시설 단일 전장 — 2026-09-08

후속 정사각형 전장 변경은 SQUARE_BATTLE_UPDATE.md가 최신 기준입니다. 아래 내용은 초기 단일 전장 적용 기록입니다.

## 실행 / 백업
- 배포하지 않았습니다. `D:/3V_TD/index.html`을 더블클릭하면 최신 `local-test/index.html`로 연결됩니다.
- 직접 실행 파일에 548개 에셋을 포함했습니다. 별도 서버가 필요하지 않습니다.
- 변경 전 백업: `artifacts/pre-single-lab-20260908-171155/` (src, tests, 이전 local-test/index.html).

## 적용 사항
- 세 맵을 청록 연구시설 한 맵으로 통합했습니다. 전장 580×800, 중앙 4×6=24칸, 최대 요원 수 22명 유지.
- 경로: (100,100) → (490,100) → (490,710) → (90,710) → (90,210). 길이 1900. 입구와 코어가 분리되며 끝에서 적이 피해를 주고 제거됩니다.
- 칸 중심 간격 72. 배경과 별개로 길·화살표·배치 패드를 실제 좌표에 조립했습니다.
- 빈칸 즉시 랜덤 소환, 선택→빈칸 이동, 선택 해제, 되돌리기, 선택 요원 위치 유지 합성, 5성 상한, 같은 요원 전체 골드 강화 유지.
- 추가 사거리는 모든 보너스를 합친 뒤 최대 72로 제한합니다. 기본 사거리 차이는 유지하며 기존 공통 절대 상한을 제거했습니다. 별과 일반 강화는 사거리를 늘리지 않습니다.
- 선택 정보에 기본/추가 사거리를 칸 단위로 표시합니다. 지원/저지와 공격 판정도 같은 계산식을 사용합니다. 연쇄·광역 전파 범위는 별도입니다.
- PC 중앙 세로 전장, 전투 광고 제거, 성장 패널 높이 예약, 보라 합성/금색 강화 버튼. 스크롤 후 Phaser 클릭 좌표가 어긋나던 문제를 수정하고 캔버스 비율을 실제 맵과 일치시켰습니다.
- 기존 21명 원화·좌우 8동작(12FPS)·위쪽 공격 시퀀스와 무기 발사 좌표를 보존했습니다. 신규 캐릭터 애니메이션을 생성하거나 12개의 고유 프레임을 새로 제작한 것은 아닙니다.

## 생성 이미지
이미지 생성 2회 사용. 기존 캐릭터는 그대로 유지했습니다.
1. `public/assets/maps/teal-laboratory.png`: 청록 연구시설 바닥·외곽 시설.
2. `artifacts/lab-ui-atlas.png`: 패드/선택/입구/코어/합성/강화 원본 아틀라스. `public/assets/lab/`에 분리·투명화하여 실제 적용했습니다. 패드·버튼 아이콘은 생성 이미지, 글자·비용·패널 배치는 실제 UI입니다.

배경 프롬프트:
> Game background, portrait 580:800 aspect. Beautiful anime sci-fi research facility, straight orthographic top-down floor, bright blue-gray and navy with restrained teal neon. Central 80 percent is EMPTY clean low-detail blue slate floor, no paths or pads. Machinery only narrow outer edges: glass cyan coolant tanks, pipes, observation windows, white metal panels. Well lit, soft illustrated textures, not photoreal, not grim military. No people, no creatures, no UI, no text, no numbers, no grids, no arrows. This empty floor is for exact gameplay paths and deployment pads added programmatically. Keep central space quiet and readable.

아틀라스 프롬프트:
> One game UI asset atlas, exact 3 columns x 2 rows, six equal square cells, no text. Navy white metal anime sci-fi teal neon style matching a bright research facility. Uniform SOLID MAGENTA #ff00ff background for extraction, no shadows outside items. Each asset centered with 15 percent blank margin. Row1: square flat deployment platform viewed directly overhead with teal edges; second selected square pad with luminous teal rim; third red rift portal circular energy gate viewed overhead. Row2: teal crystal energy core in round machine housing; second purple merge icon with three small crystals combining toward one crystal; third gold upgrade icon crystal with upward chevrons. Clean distinct silhouettes, all objects complete inside cells. No checkerboard, no lettering, no UI labels.

## 밸런스 비교
- 기존 대표 맵 1820 → 새 맵 1900 (+4.4%). 기존 이동시간 보정식을 유지하여 길 증가만으로 난도가 쉬워지지 않도록 했습니다. 공격력·체력을 일괄 올리지 않았습니다.
- 기본 덱 자동 배치/성장 3시드: 모두 20웨이브 통과, 코어 100. `artifacts/lab-balance.json`.
- 초반 소환 이후 성장 중단 3시드: 모두 20웨이브에서 종료. `artifacts/lab-opening-only.json`.
- 이 결과는 제한된 자동 전략 비교이며 사람의 승률이나 완벽한 밸런스의 증명이 아닙니다. 중앙 단거리 요원은 공격 기회를 잃을 수 있으며 이동 또는 장거리 배치가 필요합니다.

## 검증 및 한계
- 기본 검사 92개 통과: 경로 종료/제거, 소환·이동·합성·강화, 21명 추가 사거리 제한, 지원/저지 범위, 총구 좌표 포함.
- PC 1440 / Android 412 / iPhone 390 폭: 가로 넘침 없음, 캔버스 좌표 비율 일치, 선택 전후 패널 높이 변화 0, 선택 패드와 생성 텍스처 정상. `artifacts/lab-layout.json`.
- 브라우저 검사 84개 모두 통과 (PC Chromium / Android Chromium / iPhone WebKit). 21명 전체 공격 애니메이션·탄환/스킬 경계, 좌우/위쪽 무기 발사점, 직접 소환·이동·합성·강화 포함.
- TypeScript 검사 및 직접 실행 빌드 통과.
- Windows Chromium에서 루트 index.html 직접 열기: 390/1440 폭에서 소환→선택→강화 성공, 실행 오류 없음.
- 직접 실행 화면: `artifacts/direct-portrait-390.png`, `artifacts/direct-portrait-1440.png`; 성장 패널: `artifacts/local-growth-390.png`.
- 모바일 검사는 Pixel 7 Chromium / iPhone 13 WebKit 에뮬레이션입니다. 실제 기기의 발열·배터리·프레임 성능은 보장하지 않습니다.
- 작은 화면에서 세로 스크롤은 필요합니다. 전장 크기를 유지하는 대신 모든 하단 메뉴가 항상 한 화면에 들어오지는 않습니다.
- 생성 장식과 대표 실제 화면을 확인했으며, 모든 프레임의 수작업 미술 검수를 완료했다고 단정하지 않습니다.
