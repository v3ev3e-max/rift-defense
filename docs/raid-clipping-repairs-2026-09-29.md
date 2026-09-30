# Targeted artwork clipping repairs — 2026-09-29

## Scope
- Celestia skill pose 3: reconstructed clipped hair and replaced rectangular-ended muzzle effect with a complete compact flash. Pose 4 intentionally holds pose 3 during projectile travel, as before.
- Void Observer and Machine God: six newly generated attack poses each. Other states remain unchanged; this is not a claim that every existing source image has been redrawn or semantically validated.
- Runtime attack routing now uses raid-v4 for these two bosses. Their 451/512 floor baseline matches the existing v3 floor transform.

## Authored sources and reproducibility
- `art-source/hero-skill-overrides/celestia-03.png` and `celestia-04.png`
- `art-source/raid-attack-repairs/void-observer.png`
- `art-source/raid-attack-repairs/machine-god.png`
- Built-in image generation, with existing local sprites as identity references. No CLI image API used.
- Prompt set: restore Celestia's complete blue hair, rifle and tapered blue muzzle flash while preserving identity; author six leftward purple-eye-boss attack poses; author six grounded six-cannon-mech charge/fire/recoil/recovery poses. Transparent backgrounds, full bodies, isolated cells, no clipped effects or labels. Void sheet regenerated after the first result failed transparent-gutter validation.
- `scripts/pack-raid-attack-repairs.py` rejects missing transparent gutters and occupied source edges BEFORE adding output padding. It retains detached authored eye ornaments, uses one scale per sheet, and outputs six 512px square cells.
- Hero rebuilding: `python scripts/repair-hero-skill-frames.py`, then `python scripts/build-raid-actors.py`.
- Visual review contact sheet: `artifacts/raid-attack-repairs.png`.

## Verification
- Pixel audit: 714 cells, zero failures. This verifies structural margins, not all semantic artwork defects.
- Related unit tests: 18 passed.
- Desktop Chromium, Android portrait Chromium and iPhone WebKit: 12 browser tests passed (emulation, not physical devices).
- Root `index.html` direct-open verification passed: redirects to rebuilt offline bundle, five embedded fixed-idle actors, no JavaScript errors.
- Production and embedded offline builds passed; 3737 embedded assets.
- No commit or GitHub deployment performed in this repair pass.
