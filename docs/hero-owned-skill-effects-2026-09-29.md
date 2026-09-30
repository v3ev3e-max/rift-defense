# Caster-owned skill effects

Implemented:
- All 44 heroes resolve their own skill artwork through `HeroSkillEffects.ts`. Unknown heroes throw rather than silently using another character's effect.
- Raid skill impacts no longer use the hero's basic `impact.webp`. Attack skills use their own skill image; tanks/support use their own four-frame defensive/support effects.
- Support effects target allies; defensive tank effects target the caster. They no longer fly at the enemy like offensive skills.
- Campaign skill overlay no longer reuses basic impact frames.
- Dedicated DOM effects clean up after one playback and remain within arena bounds.
- Regression coverage checks every referenced asset, cross-hero byte duplicates, role targeting, decoding, and cleanup for all 44 heroes.

Limitations:
- This change reuses existing personal artwork. No new image generation occurred.
- Different hashes do not prove visually distinct silhouettes; a complete visual-design audit is still needed.
- Offensive raid skill projectile sheets still use the existing four transformed versions of a static skill image. This is not four independently drawn animation poses.
- Common duration/buff status indicators remain. They are not presented as newly authored personal skill animations.
- No GitHub deployment performed.
