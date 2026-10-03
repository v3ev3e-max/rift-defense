# 얼굴 초상화 재제작 및 UI 통일

내장 image_gen으로 전신 구도였던 민서·다은·아이리스·루크·프레이야·발렌·닉스·시엘·에이르·라온의 초상화 10개를 개별 재제작했다. 참조 원본은 `public/assets/illustrations/{id}.webp`, 적용 자산은 `public/assets/face-icons/{id}-face-v2.png`이다. 기존 원본과 얼굴 아이콘은 보존했다.

44명 전체는 `src/ui/HeroPortraits.ts`에서 얼굴 전용 경로를 선택한다. 카드·상세·장비 소유자·모집·배치·HUD·결과의 공통 초상화 함수가 이 경로를 사용한다. 리아·에코·메리엘·셀레네·오필리아의 일러스트 예외 연결을 제거했다. 작전 본부의 세라 메인 전신은 별도 이미지로 유지한다.

## 공통 제작 프롬프트

Use case: identity-preserve. Recreate this exact character as a premium anime game FACE PORTRAIT. Input image is identity reference: preserve face identity, gender, hair color/style/accessories, eye color, and collar/shoulder outfit. Square 1:1 icon composition. Head and face dominate; show only entire head and upper shoulders, absolutely no waist, hands, legs or weapon. Entire top of hair/accessories inside frame with 6% headroom. Eye line 43% image height, chin at 76%, head width about 68% canvas, shoulders bottom. Polished consistent semi-realistic anime illustration, delicate line art and detailed eyes, same style as a high-quality gacha roster portrait. Subtle dark navy teal gradient background with faint light accents, no text or border. Single centered subject, face unobscured, no duplicate, no full body. This is a new closeup redraw, not a tiny full body inside square.

## 검증

`e2e/illustrations.spec.ts`는 44개 선택된 얼굴 파일을 실제 디코딩하고 정사각형·최소 256px·카드 및 서포터 배치의 얼굴 경로를 검증한다. PC Chromium·Android 세로·iPhone WebKit 세 환경에서 실행한다. 전체 비교 이미지는 `artifacts/portrait-contact-sheet.jpg`이다.

이번 변경은 초상화와 UI 경로 통일에 한정된다. 별도 진행 중인 공격 원본 잘림 문제는 이 배포의 완료 항목에 포함하지 않는다.
