# Raid animation repair — 2026-09-28

## Latest checkpoint — 2026-09-29

- Related unit tests: 18 passed. Earlier full unit run: 668 passed.
- Raid browser checks: 21 passed; additional ground-anchor checks: 3 passed
  on desktop Chromium, Android viewport and iPhone WebKit emulation.
- Structural pixel audit: 702 cells passed (660 hero + 42 Gale boss cells).
- Production and standalone builds passed; root index direct-open redirect and
  five fixed embedded idle actors verified without JavaScript errors.
- No GitHub push/deployment at this checkpoint; remaining art review below.

## Implemented locally

- Explicit fixed idle texture; attack/skill/hit use event-owned finite playback.
- Priority and stale-callback guards; WebKit deadline fallback releases actions.
- Removed forced 160% hero scale. Square sprite cells and 86% ground baseline.
- Grounded bosses do not bob; void observer / aeon sovereign use 1.5px motion.
- No full-screen rerender for raid ticks, manual cast, or AUTO toggle.
- Hero projectile effects start on actions and expire instead of looping forever.
- 44 skill tracks re-extracted/repacked, plus 44 idle and 44 attack tracks.
- Elise/Celestia source contains a projectile-only fourth cell: hold their firing
  pose during travel instead of displaying the projectile as the character.
- Source strips archived outside public assets so offline builds do not embed them.

## Validation scope

Pixel audit checks 660 hero cells for margins, empty cells, large detached islands,
and exact cross-hero copies. It does NOT recognize anatomy or guarantee that a
generated effect is artistically complete. Ian's third skill contains authored
detached drones and has an explicit reviewed component exception.

Browser tests check fixed idle, one-shot completion, all 44 assets decoding,
five boss state tracks, stable live DOM, and square/in-bounds actors on desktop,
Android and iPhone viewport/engine emulation. This is not a physical-device test.

## Not complete / release hold

Gale colossus was subsequently regenerated on 2026-09-29: six source sheets,
seven runtime states (idle is the fixed neutral prepare pose), a common scale
and floor anchor. New files are in `public/assets/generated/raid-v4/bosses/gale-colossus`;
sources are in `art-source/raid-gale-v4`. One clipped final prepare pose is
deliberately replaced by a hold of the preceding intact pose, recorded by
`scripts/pack-gale-v4.py`. Other six-pose action tracks retain all six poses.

Other source boss strips have overlapping effects and hard boundaries. Adaptive
alpha-gutter extraction reduces wrong-cell cuts but cannot recreate missing art.
Several effect-heavy hero poses still need an art-level review/replacement,
not another CSS crop. Gaia's third skill was restored with the built-in image
generator, preserving her pose and removing the unrelated left-side fragment.
Replacement sources are `art-source/hero-skill-overrides/gaia-03.png`,
`arin-04.png`, and `aurora-05.png`; the latter two remove detached beam fragments.
Ten newer heroes retain their existing
pose variants; repacking does not turn them into newly drawn action sequences.
Solar sphinx / aeon sovereign still use legacy attack/idle fallback art for some
states. Their playback is finite but they do not have seven unique authored tracks.

Do not describe this checkpoint as all image clipping fixed or fully deployed.
Regenerate only the failed source poses with isolated, generous gutters; review
each output at full size, then repeat pixel, browser and offline checks before release.

## Image generation prompt (built-in imagegen)

Precise-object-edit: preserve Gaia's brown hair, SD proportions, black/gold armor,
raised cyan-gold sword and cyan shield. Remove the unrelated chopped yellow
semicircle at the left. One complete character, compact complete effects, genuine
transparent background, 16% empty margin, no text, no duplicate or extra objects.

Arin/Aurora: preserve the exact SD identity, pose, full hair, weapon, feet and
compact effects. Remove only the unrelated triangular yellow/cyan beam entering
from the left. One complete character, transparent background, 16% padding;
no extra objects, text, grid, background or duplicated body.

Gale prompt set (built-in imagegen, reference: existing silver/cyan boss):
Production sprite sheet, exactly six successive poses, three columns by two
rows, same silver-white armored cyan storm knight with halo, huge lance and
shield. Preserve character proportions, equal scale and ground baseline. Entire
silhouette, weapon, halo, feet and effects inside each cell with large transparent
gutters. No overlap, text, grid lines, scenery or rectangular matte blocks.

- prepare: neutral, lower weight, bend knees, draw lance back, brace shield, wind up.
- attack: wind up, step forward, thrust left, compact cyan burst, recoil, stand.
- pattern: lance low, lift diagonally, raise overhead, vortex forms, expands, dissipates.
- hit: stand, shield spark, lean back, brace, recover, stand.
- phase: stand, core glows, halo brightens, rings form, armor shines, strong stance.
- death: weakened, lower weapon, bend knees, kneel, collapse on knee, core fades.
