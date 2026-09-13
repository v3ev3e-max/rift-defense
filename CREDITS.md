# Assets & third-party notices

| 에셋 | 제작 | 출처 | 라이선스 |
| --- | --- | --- | --- |
| 10명 픽셀 요원 PNG / SVG | RIFT DEFENSE 프로젝트 | `scripts/generate-assets.mjs` | 이 저장소의 MIT 라이선스 |
| 고정 도시 전장, 적 스프라이트 | RIFT DEFENSE 프로젝트 | `src/game/BattleScene.ts`의 직접 작성 도형 | 이 저장소의 MIT 라이선스 |
| 도시 배경, 전술 지도, UI 도형 | RIFT DEFENSE 프로젝트 | `src/style.css`, `src/ui/` | 이 저장소의 MIT 라이선스 |
| UI SVG 아이콘, PWA 아이콘 | RIFT DEFENSE 프로젝트 | `src/ui/components.ts`, `public/icon.svg`, 생성 스크립트 | 이 저장소의 MIT 라이선스 |
| 효과음 | Pixabay 제작자·커뮤니티 | 아래 개별 원본 페이지 | Pixabay Content License |

외부 게임 그래픽은 사용하지 않습니다. 폰트는 OS에 설치된 시스템 폰트로 렌더링합니다.

## Pixabay sound effects (2026-09-09)

Pixabay Content License에 따라 게임의 구성 요소로 사용하며, 원본 음원 파일을 독립 상품으로 재배포하지 않습니다.

| 게임 용도 | 음원 / 제작자 | 원본 |
| --- | --- | --- |
| 일반 사격·저격 | Gunshot / Universfield | https://pixabay.com/sound-effects/film-special-effects-gunshot-352466/ |
| 에너지·마법 | Sci-Fi Weapon Laser Shot 04 / DavidDumaisAudio | https://pixabay.com/sound-effects/film-special-effects-sci-fi-weapon-laser-shot-04-316416/ |
| 근접 베기 | Sword Slash and Swing / DavidDumaisAudio | https://pixabay.com/sound-effects/film-special-effects-sword-slash-and-swing-185432/ |
| 포격·운석 | Explosion FX / SoundReality | https://pixabay.com/sound-effects/film-special-effects-explosion-fx-343683/ |
| 드론 | Sci-Fi Drone Transition Effect / dream_sequencer | https://pixabay.com/sound-effects/film-special-effects-sci-fi-drone-transition-effect-200107/ |
| 소환 | Stand Summon Effect / freesound_community | https://pixabay.com/sound-effects/film-special-effects-stand-summon-effect-40997/ |
| 합성 | Level Up Chime / Universfield | https://pixabay.com/sound-effects/film-special-effects-level-up-chime-132474/ |
| 성장·유물 | Power Up Game Sound Effect / PWLPL | https://pixabay.com/sound-effects/film-special-effects-power-up-game-sound-effect-359227/ |
| 보스 경보 | Alarm / SoundReality | https://pixabay.com/sound-effects/technology-alarm-471496/ |
| 승리 | Winner Game Sound / PuyoPuyoMegaFan1234 | https://pixabay.com/sound-effects/film-special-effects-winner-game-sound-404167/ |
| 패배 | Marimba Game Over / Universfield | https://pixabay.com/sound-effects/film-special-effects-marimba-game-over-250960/ |

라이선스 요약: https://pixabay.com/service/license-summary/

## Libraries

- **Phaser 3** — Phaser Studio / Richard Davey, [phaser.io](https://phaser.io/), MIT.
- **Vite** — Vite contributors, [vite.dev](https://vite.dev/), MIT.
- **TypeScript** — Microsoft, [typescriptlang.org](https://www.typescriptlang.org/), Apache-2.0.
- **Vitest** — Vitest contributors, [vitest.dev](https://vitest.dev/), MIT.
- **Playwright** — Microsoft, [playwright.dev](https://playwright.dev/), Apache-2.0.

각 패키지의 실제 LICENSE는 설치된 해당 npm 패키지에 포함됩니다. 엔진은 npm을 통해 로컬 번들에 포함되며 외부 CDN 실행에 의존하지 않습니다.

## Phase 5 hero prototype art
- 10 hero portraits and chibi combat assets were generated specifically for this project with OpenAI image generation, then cropped/optimized for the in-game UI.
- Cast ratio: 7 female (Yuria, Reina, Arin, Karin, Sera, Luna, Mia) / 3 male (Noel, Ian, Leon).
- These are project-specific prototype assets; replace with final commissioned/original art before a production art lock if desired.

## Visual asset revision
- All 21 operators' three-frame SD combat sheets and projectile/impact/skill sheets were generated with the built-in OpenAI image generation tool for this project.
- Original generation prompts and selected sources: `artifacts/visual-audit/prepared.json`; copied sheets: `artifacts/visual-sources/`.
- Final alpha, sizing, alignment and browser verification: `VISUAL_VERIFICATION.md`. Existing portrait images were retained.

## North-facing attack extension
21 hero rear-view attack sequences generated with built-in imagegen, September 2026. See NORTH_ATTACK_AND_GROWTH.md for prompts and source/output locations.

## Single laboratory art (2026-09-08)
Two built-in OpenAI image-generation calls produced the laboratory background and six-part UI atlas. Prompts, extracted assets and verification are recorded in SINGLE_LAB_UPDATE.md. Existing operator illustrations and animations were preserved.
