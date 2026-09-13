# 생성 이미지 적용 기록 — 2026-09-08

## 적용 위치

- `public/assets/generated/enemies/`: 일반 적·엘리트·보스 13종
- `public/assets/generated/drone/`: 드론 본체, 탄환, 피격, 과충전
- `public/assets/generated/enemy-effects/`: 분노, 빙결, 폭풍, 공허, 교란
- `public/assets/generated/status/`: 화상, 출혈, 감속, 방어 파괴

총 26개 PNG를 생성 원본에서 정리해 적용했습니다. 모든 파일은 정사각형 RGBA PNG이며 네 모서리 알파가 0이고, 실루엣 밖에 약 9% 안전 여백을 둡니다.

## 생성 프롬프트 기준

적 이미지는 다음 공통 구조에 각 적의 역할·색·실루엣을 넣어 개별 생성했습니다.

> Transparent game enemy sprite, exactly one connected full creature, polished anime science-fiction style, near-orthographic top-down three-quarter view, readable at 64/80/112 pixels, complete silhouette with clear margin, no ground, no text, no border, nothing cropped.

드론과 전투 효과는 다음 기준으로 각각 별도 생성했습니다.

> Transparent game asset, exactly one centered object or combat effect, bright teal research-facility palette, bold silhouette readable at gameplay size, clear outer margin, no character, no ground, no text, no border, nothing cropped.

상태 아이콘은 20px에서도 화염·출혈·빙결·깨진 방패를 구분할 수 있도록 단순한 실루엣으로 생성했습니다.

## 후처리

생성 원본에 투명 배경처럼 포함된 체크무늬와 흰색·검은색 배경을 가장자리 연결 영역만 제거하는 방식으로 정리했습니다. 내부 흰 장갑판과 밝은 효과 중심부는 보존했습니다. 재처리 스크립트는 `scripts/process-generated-assets.py`입니다.

## 실제 연결

- `BattleScene.ts`: 적, 드론, 상태, 원소 마크, 보스·교란·원소 반응 효과 로드 및 표시
- `CombatSystem.ts`: 드론 발사·피격·과충전과 적 범위 공격의 시각 키 지정
- `ElementSystem.ts`: 원소 반응을 공용 원소 피격 이미지에 연결
- `BattleModel.ts`: 보스 등장 시 보스 종류별 효과 연결

수치 판독에 필요한 경로, 체력바, 사거리 원, 이동 선택 표시는 실시간 데이터와 일치해야 하므로 코드 도형으로 유지했습니다.
