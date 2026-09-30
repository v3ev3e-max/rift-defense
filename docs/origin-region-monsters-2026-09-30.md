# Regions 13–16 monster expansion

## Added roster
- Region 13: Crystal Bastion, Tide Skimmer, Prism Cannon, Coral Singer.
- Region 14: Lunar Husk, Spore Leaper, Moon Ray, Bloom Keeper.
- Region 15: Stellar Plate, Plasma Hound, Nova Turret, Forge Conductor.
- Region 16: Origin Warden, Causal Blade, Genesis Eye, Fate Weaver.

These sixteen definitions previously pointed at Region 9–12 `visualId` aliases. They now load their own regional artwork. Named and boss enemies intentionally retain their existing signature art until their own replacement pass.

## Assets and behavior
- Each monster has a unique transparent base sprite, six bounded movement frames and three death frames.
- Prism Cannon, Moon Ray, Nova Turret and Genesis Eye have three personal firing frames.
- Regions 13–16 have separate projectile, impact and footstep effects.
- The roles remain mechanically distinct: bruiser, charger, ranged and support/healer.
- All runtime frames have at least eight transparent pixels at the edge; all sixteen base hashes are unique.

## Image generation
- Built-in image generation was used, with one authored 2x2 regional roster sheet per region.
- Source files: `art-source/campaign-enemies/regions-13-16/region-13.png` through `region-16.png`.
- Prompts specified the four role silhouettes, regional materials/palette, left-facing three-quarter view, transparent background, isolated grid cells and clipping-safe margins. Region 16 was regenerated because the first sheet failed the occupied-gutter check.
- Reproducible packer: `scripts/install-origin-region-enemies.py`.

## Verification
- 207 campaign/unit tests passed, including sixteen identities and all asset paths.
- Desktop Chromium and Android portrait loaded all four regions successfully.
- iPhone WebKit loaded each of Regions 13–16 successfully; tests are split per region because sequentially decoding four full battle scenes exceeds the suite-wide three-minute test limit on the emulator.

## Clipping debug follow-up
- The previous body-only margin check missed four clipped final impact frames. Their 60px rays exceeded the 48px half-canvas; the effect generator now keeps rays and stroke within an 8px gutter.
- Added `scripts/test-origin-region-pixels.py` to check all 212 installed images, including firing, death, projectiles, impact and steps. Also added this check to CI.
- Enemy rendering now fits the rotated rectangle while respecting its actual (.5, .72) anchor. Projectile and impact rendering also fit within the map.
- Browser coverage now forces all sixteen monsters to each map corner and checks actual rendered bounds, including ranged firing poses. This caught and corrected the anchor mismatch during development.
- Movement frames remain procedural transforms of authored single poses; this clipping repair does not turn them into independently drawn limb animations.
- Final checks: 212 image margin checks, 2 related unit tests, and 12 browser tests (desktop Chromium, Android emulation, iPhone WebKit) passed. Production and offline builds passed; PC direct-open campaign deployment/start passed. These are emulator checks, not physical-device testing.
