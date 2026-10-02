# 모집 공개 연출 개편

## 전용 이미지 에셋 적용 (추가 작업)

내장 image_gen으로 모집 배경, 일반/SR/SSR 카드 뒷면, SR 황금 후광, SSR 균열 프리즘 공개 FX 총 6종을 새로 생성하여 `public/assets/ui/recruit/`에 저장했다. 기존 CSS 별표·균열 도형·후광은 이미지 렌더링으로 교체했다. CSS는 이미지를 배치하고 불투명도·크기·뒤집기를 재생한다. 영웅 원본 일러스트와 효과음은 기존 에셋이다.

생성 프롬프트: [recruit-art-prompts-2026-10-01.md](recruit-art-prompts-2026-10-01.md). `python scripts/test-recruit-art.py`에서 6종 해시 중복 없음, RGBA 투명도, 가장자리 알파값 8 이하 검사를 통과했다. 프로덕션과 오프라인 빌드에 신규 이미지 6개가 포함됐으며, 기본 index.html 직접 실행에서 1254px SSR 공개 FX 로딩과 가로 스크롤 없음이 확인됐다.

## 구현

- 1회·10회 모두 확정된 결과를 전용 고정 오버레이에서 표시한다. 기존 모집 확률, 골드 비용, 천장, 조각 지급 및 저장 구조는 변경하지 않았다.
- 10회는 2행 × 5열로 70ms 간격 등장하며 마지막 카드의 등장 완료 후 등급 예고를 시작한다.
- 내부 S는 모집 화면에서 SR(12%), 내부 SR은 SSR(3%)로 표시한다. 내부 ID 및 기존 저장 데이터는 그대로 유지한다.
- SR은 황금 테두리·파동·후광, SSR은 황금 예고 후 균열·프리즘 공개로 구분한다. 공개는 각각 3초이며 기존 level/relic 효과음을 구분해 사용한다.
- 별도 중앙 공개 레이어는 기존 영웅 일러스트를 contain으로 표시한다. 원본에 없는 전신 영역을 새로 생성한 것은 아니다.
- 전체 공개는 미공개 카드만 순차 재생한다. 건너뛰기는 진행 중 타이머와 소리를 정리하고 모든 결과를 공개한다.
- 배경 스크롤 잠금은 오버레이 생명주기에 한정한다. 종료·화면 전환 시 body/html 인라인 스타일, 스크롤 위치, 포커스를 복원한다.
- 모션 감소 설정, 키보드 포커스 순환 및 Escape 종료를 지원한다.

## 검증

- 단위 테스트 36개 파일, 685개 항목 통과.
- Chromium PC·Android에서 실제 모집 비용 1회 차감, 중복 입력, SR/SSR 공개, 6종 등급 조합, 세로·가로·낮은 높이, 페이지 너비, 스크롤 복원 검증.
- WebKit iPhone 환경에서 동일 시나리오 및 공개 큐 중단·모션 감소·화면 이동 검증. 실제 물리 기기를 사용한 검증은 아니다.
- 390×844, 844×390, 640×320에서 카드 10장과 하단 버튼의 뷰포트 경계 및 오버플로 검사.
- 프로덕션 및 오프라인 빌드 완료. 기본 index.html 직접 열기에서 SSR 공개, 가로 스크롤 없음, 스크롤 잠금 복원을 확인.
- GitHub 배포는 수행하지 않음.

## 실행

```sh
npx vitest run --maxWorkers=2
npx playwright test e2e/recruit-reveal.spec.ts e2e/recruit.spec.ts
npm run build
npm run build:local
```

연출 캡처: artifacts/recruit-ten-android-portrait.png, artifacts/recruit-sr-android-portrait.png, artifacts/recruit-ssr-android-portrait.png.
