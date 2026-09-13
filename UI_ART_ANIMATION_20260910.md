# UI 이미지·애니메이션 적용

## 생성 및 적용 에셋

- `public/assets/ui/generated/laboratory-frame.webp`: 세로형 청록 연구시설 외곽 프레임
- `public/assets/ui/generated/panel-surface.webp`: 글자 가독성을 유지하는 저대비 금속 패널
- `public/assets/ui/generated/button-neutral.webp`: 기본 전투 기능 버튼
- `public/assets/ui/generated/button-active.webp`: 청록 활성 버튼
- `public/assets/ui/generated/button-upgrade.webp`: 금색 강화 버튼
- `public/assets/ui/generated/button-fusion.webp`: 보라색 합성 버튼

이미지는 문자·숫자·캐릭터 없이 생성했으며 모든 문구와 수치는 HTML로 유지한다.

## UI 모션

- 느린 연구시설 스캔 광원
- 버튼 광택 이동, 눌림, 호버 반응
- 소환 카드 순차 등장과 선택 펄스
- 소환·속성 강화·DPS 패널 펼침
- 선택 요원 카드 등장
- 상태 점, 로고, 코어 게이지 발광
- `prefers-reduced-motion` 환경에서는 모든 장식 애니메이션 비활성화

## 확인

- `local-test/index.html` 직접 실행
- PC 1440px, Android 412px, iPhone 390px
- 전장 크기, 가로 스크롤, 버튼 클릭, 캐릭터 선택, 드래그 합성, 판매 확인
- 21명 얼굴 초상화 256×256 로딩 확인

배포하지 않았다.
