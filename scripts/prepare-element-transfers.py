from pathlib import Path
from PIL import Image, ImageEnhance

SOURCE = Path(r"C:/Users/PC/.codex/generated_images/01a07544-c4a3-75a1-8a61-2124d1422fc4/exec-c7a140b2-0bce-4b58-909c-b57c67ad457a.png")
OUT = Path("public/assets/generated/element-transfers")
NAMES = ("water", "fire", "electric", "dark")


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    cell_width = image.width // len(NAMES)
    for index, name in enumerate(NAMES):
        right = image.width if index == len(NAMES)-1 else (index+1)*cell_width
        # The useful horizontal trails occupy the middle band; very faint outer
        # glow spans most of the generated canvas and must not determine sizing.
        frame = image.crop((index*cell_width, 190, right, 500)).resize((248, 84), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (256, 96))
        canvas.alpha_composite(frame, ((256-frame.width)//2, (96-frame.height)//2))
        canvas.save(OUT / f"{name}.webp", "WEBP", lossless=True, method=6)
        for phase, reveal in enumerate((0.34, 0.62, 1.0, 1.0), 1):
            animated = canvas.copy()
            alpha = animated.getchannel("A")
            if phase < 3:
                mask = Image.new("L", animated.size)
                start = int(animated.width * reveal)
                for x in range(animated.width):
                    value = 255 if x <= start else max(0, 255-(x-start)*22)
                    for y in range(animated.height):
                        mask.putpixel((x, y), value)
                alpha = Image.composite(alpha, Image.new("L", animated.size), mask)
            elif phase == 4:
                alpha = ImageEnhance.Brightness(alpha).enhance(.58)
            animated.putalpha(alpha)
            animated.save(OUT / f"{name}_{phase:02d}.webp", "WEBP", lossless=True, method=6)
    (OUT / "SOURCE_PROMPT.txt").write_text(
        "Four transparent horizontal transfer trails: water, fire, electric, dark; anime teal-neon SF tower-defense VFX; exact endpoint alignment; no characters, text or HUD.\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
