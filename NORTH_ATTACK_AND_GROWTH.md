# 합성·강화 및 위쪽 공격

- 전투의 요원을 선택하면 별, 공격력, 강화 단계, 합성 재료 수와 강화 비용을 표시합니다.
- 같은 요원·같은 별 3명을 합성하면 선택한 요원이 그 자리에 남아 별이 1 증가합니다. 최대 5성입니다.
- 골드 강화는 기존 전투 연구와 동일한 성장 수치를 사용하며 같은 요원 전체에 적용합니다. 최대 15단계, 전투 종료 시 초기화됩니다. 영구 계정 강화와 별개입니다.
- 21명 모두 실제 목표가 위쪽일 때 전용 후면 공격을 사용하고 좌우 목표는 기존 공격을 사용합니다.
- 위쪽 공격은 서로 다른 3개 원화 동작을 기존 8타이밍 / 12FPS 시퀀스에 배치했습니다. 8개 모두 별도 원화라는 의미는 아닙니다.
- 기존 좌우 에셋은 유지합니다. 배포하지 않습니다.

## 에셋
내장 imagegen 도구로 제작했습니다. 5개 묶음의 원본과 배경 수정본 중 최종 원본은 artifacts/up-attack-sources/atlas-1.png ~ atlas-5.png에 보관합니다.
게임용 결과: public/assets/combat/<hero>/up_01.png ~ up_03.png (21명 × 3 = 63장, RGBA 160×160).
각 시퀀스의 크기와 발 기준선을 맞추고 단색 배경을 런타임용 알파로 변환하는 추출 도구: scripts/extract-up-atlases.mjs.

최종 생성 프롬프트 공통 규격:
“Production chibi pixel-art game animation atlas, 3 columns x 5 rows (last hero: 3 x 1), equal square cells. Preserve reference hero identities, clothes, hair and weapons in exact row order. All viewed from behind facing NORTH/up screen attacking away from camera. Three distinct sequential poses: ready / upward attack / recovery. Whole body and weapon inside each cell with safe margin, consistent scale and foot baseline. Pure solid magenta #ff00ff background for chroma-key extraction, no checkerboard, shadows, text or borders.”
행 순서: yuria/reina/arin/karin/sera; noel/luna/mia/ian/leon; adela/neris/belka/serin/kyle; livia/kairon/theria/noxia/aurora; arden.
첫 묶음의 배경 수정: “Preserve every character and pose and row order. Replace all checkerboard background with pure flat solid magenta #ff00ff; keep figure colors intact and 3 columns by 5 rows.”

## 검증 결과
- 기존 단위 검사 93개 통과. 위/아래 공격 방향 전환 조건 검사 포함.
- PC Chromium, Android Chromium, iPhone WebKit의 합성·강화 실클릭 및 21명 전체 방향/텍스처 전환 검사 통과 (기기별 2개, 총 6개 시나리오).
- 초기 검사에서 버튼 DOM을 매번 교체해 클릭이 실패하는 문제를 발견했습니다. 렌더 문자열을 보관해 내용이 달라질 때만 교체하도록 수정한 뒤 실패했던 PC/Android 시나리오를 재검증했습니다.
- file:// index.html 직접 실행: 너비 390/1440에서 소환 → 선택 → 강화 Lv.1 확인, 실행 오류 없음.
- 로컬 실행 파일을 541개 내장 에셋으로 다시 만들었습니다.
- 전체 이전 E2E 묶음은 이전 가로 전장·대기석 가정이 있어 이번 완료 근거로 사용하지 않았습니다.
