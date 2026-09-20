"""Remove detached top-edge generation fragments from side attack frames."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def clean(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    width, height = image.size
    visible = {(x, y) for y in range(height) for x in range(width) if alpha.getpixel((x, y))}
    components: list[set[tuple[int, int]]] = []

    while visible:
        start = visible.pop()
        component = {start}
        queue = deque([start])
        while queue:
            x, y = queue.popleft()
            for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if point in visible:
                    visible.remove(point)
                    component.add(point)
                    queue.append(point)
        components.append(component)

    # Corrupt strips touch the generated canvas gutter (y <= 9), stay entirely
    # above the character, and are disconnected from the real pose. Requiring
    # all three conditions preserves intentional floating particles lower down.
    fragments = [
        part
        for part in components
        if min(y for _, y in part) <= 9 and max(y for _, y in part) < 24
    ]
    if not fragments:
        return
    pixels = image.load()
    for fragment in fragments:
        for x, y in fragment:
            pixels[x, y] = (0, 0, 0, 0)
    image.save(path, optimize=True)


if __name__ == "__main__":
    for frame in sorted((ROOT / "public/assets/combat").glob("*/frame_*.png")):
        clean(frame)
