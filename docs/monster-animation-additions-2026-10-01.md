# Monster animation inspection and additions

The inspection covers 93 registered campaign enemy definitions (including visual aliases). Before this pass only the area-4 brute had a connected dedicated melee attack. 47 definitions had regional ranged fire assets; none had an authored hurt pose. 75 definitions resolved regional death assets. Existence is not evidence that every legacy frame is anatomically animated; legacy movement and death packs include procedural transformations.

This pass adds 64 newly drawn poses to the sixteen regular enemies of regions 13–16: anticipation/contact/recovery and one hurt recoil per enemy. The built-in image-generation tool used each existing region roster as identity reference. The final prompt set requested a 4×4 transparent atlas, one monster per row, preparation/contact/recovery/hurt per column, left-facing consistent identity, and generous empty cell gutters. Region 13 was regenerated because the first sheet had no clean column gutters. Original accepted atlases are saved in `art-source/campaign-enemies/origin-actions/region-{13..16}.png`.

`scripts/pack-origin-actions.py` separates cells only along verified transparent gutters and checks source edges. It preserves the drawings, uses one scale for all four poses per monster, and packs 192×192 WebPs with a fixed 165px floor and at least 27px intended padding. Runtime assets are under `public/assets/generated/campaign-enemies/map-{13..16}/{monster}/attack` and `/hit`.

Melee, ranged, and support healing timestamps trigger finite 0.66-second action playback. Health loss triggers one 0.18-second hurt pose, rate-limited to prevent continuous damage flicker. Paused or blocked monsters no longer cycle locomotion images. Enemy pool reuse now clears all three event timestamps; previously `Object.assign` left optional attack timestamps behind.

Remaining: dedicated melee and hurt art for the older regular enemies, named enemies, and campaign bosses. These are listed explicitly in `docs/monster-animation-audit.json`; this pass does not claim all 93 monsters are fully authored. Existing death and locomotion transformations were not replaced in this pass.

Verification: distinct action hashes, no movement-frame reuse, finite playback and pool reset unit tests; source gutters and installed alpha margins; browser rendering for all sixteen monsters on desktop, Android portrait, and iPhone WebKit. Browser tests force actual attack/healing/hurt timestamps and ensure expired animations return to a fixed non-moving pose. These are browser emulations, not physical-device tests.
