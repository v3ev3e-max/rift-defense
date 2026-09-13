from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

SOURCE = Path("public/assets/generated/vfx/slash.webp")
OUT = Path("public/assets/generated/slash-animation")


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            chroma = max(r, g, b) - min(r, g, b)
            pixels[x, y] = (r, g, b, round(a * min(1, max(0, (chroma-18)/25))))
    box = image.getchannel("A").getbbox()
    image = image.crop(box) if box else image
    image.thumbnail((300, 260), Image.Resampling.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    base = Image.new("RGBA", (320, 320))
    base.alpha_composite(image, ((320-image.width)//2, (320-image.height)//2))
    for phase, cutoff in enumerate((.73, .45, 0, 0), 1):
        frame = base.copy()
        alpha = frame.getchannel("A")
        if cutoff:
            mask = Image.new("L", frame.size)
            edge = int(frame.width*cutoff)
            for x in range(frame.width):
                value=max(0,min(255,(x-edge)*16))
                for y in range(frame.height): mask.putpixel((x,y),value)
            alpha=Image.composite(alpha,Image.new("L",frame.size),mask)
        if phase==4:
            alpha=ImageEnhance.Brightness(alpha.filter(ImageFilter.GaussianBlur(2))).enhance(.42)
        frame.putalpha(alpha)
        frame.save(OUT/f"slash_{phase:02d}.webp","WEBP",lossless=True,method=6)


if __name__ == "__main__":
    main()
