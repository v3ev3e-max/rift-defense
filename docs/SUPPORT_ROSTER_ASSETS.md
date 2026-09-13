# 서포터 포지션 및 에셋 적용 기록

## 역할 구성

| 등급 | 요원 | 역할 | 전용 스킬 |
|---|---|---|---|
| B | 리아 (Rhea) | 범위 회복·보호막 | LIFELINE BLOOM |
| B | 에코 (Echo) | 재사용 가속·스킬 충전 | TEMPO LINK |
| A | 메리엘 (Meriel) | 상태 해제·보호막·화력 지원 | EMBER CHOIR |
| S | 셀레네 (Selene) | 광역 취약·방어 약화·흡수 회복 | ECLIPSE HYMN |
| SR | 오필리아 (Ophilia) | 전군 회복·보호막·상태 해제·충전 | CELESTIAL SANCTUM |

정식 편성 포지션 `support`를 추가했다. UI 필터, 포지션 정렬, 추천 자동 배치와 전투력 계산이 이 포지션을 인식한다. 추천 조합은 탱커 1 / 딜러 2 / 저격수 1 / 서포터 1이며 역할 중복을 제한하지 않는다.

## 생성 에셋

각 ID별로 다음 파일을 적용했다.

- 얼굴 중심 메인 일러스트: `public/assets/illustrations/{id}.webp` (576×768)
- 얼굴 아이콘: `public/assets/face-icons/{id}.webp` (512×512)
- SD 기본 이미지: `public/assets/heroes/{id}.png`, `public/assets/heroes/{id}/frame_01..03.png` (160×160)
- 측면 공격: `public/assets/combat/{id}/frame_01..08.png` (160×160)
- 위 방향 공격: `public/assets/combat/{id}/up6_01..06.png` (160×160)
- 쓰러짐: `public/assets/generated/hero-defeat/{id}/frame_01..03.webp` (160×160)
- 전용 스킬: `public/assets/generated/support-skills/{id}/frame_01..04.webp`
- 기본 투사체·피격·스킬 이미지: `public/assets/effects/{id}/`

## 생성 프롬프트 기준

일러스트는 각 캐릭터의 머리색·장비·속성 장치를 명시하고 “FACE-FOCUSED close-up portrait, shoulders up, face occupies 65 percent, Korean subculture mobile RPG illustration, no text”를 공통 기준으로 사용했다.

SD 원화는 “transparent-background full-body chibi anime game battle sprite, facing right, entire character visible, generous transparent padding, no ground shadow, no text”를 공통 기준으로 사용했다.

전용 스킬 이펙트는 각 역할에 맞는 수류 의료 파동, 전술 중계 파동, 화염 수호 성가, 월식 저주진, 천공 성역을 각각 “transparent background, centered, isolated, no character, no text” 조건으로 생성했다.

