from pathlib import Path
from PIL import Image

SOURCE = Path(r"C:/Users/PC/.codex/generated_images/01a07544-c4a3-75a1-8a61-2124d1422fc4/exec-f8ff735d-ef3d-4ff4-8d3a-483471685845.png")
OUT = Path("public/assets/generated/enemy-steps")


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    cell_width = image.width // 4
    for index in range(4):
        left = index * cell_width
        right = image.width if index == 3 else (index + 1) * cell_width
        frame = image.crop((left, 0, right, image.height))
        alpha_box = frame.getchannel("A").getbbox()
        if alpha_box:
            frame = frame.crop(alpha_box)
        canvas = Image.new("RGBA", (192, 96))
        frame.thumbnail((176, 80), Image.Resampling.LANCZOS)
        canvas.alpha_composite(frame, ((192 - frame.width) // 2, 96 - frame.height))
        canvas.save(OUT / f"step_{index + 1:02d}.webp", "WEBP", lossless=True, method=6)
    (OUT / "SOURCE_PROMPT.txt").write_text(
        "Horizontal four-frame transparent sprite sheet for a grounded enemy footstep/contact cycle in an anime-style teal neon SF laboratory tower-defense game. Four clearly separated equal cells: heel contact, weight compression, toe push-off, dust/energy settle. Low-profile cyan and violet floor sparks, small mechanical dust motes, oval ground-contact flashes, no creature, no character, no text, no HUD, no checkerboard, fully transparent background, orthographic top-down game VFX, restrained glow, crisp readable edges, consistent 192x96 frame footprint, nothing clipped.\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
