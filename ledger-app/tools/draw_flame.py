#!/usr/bin/env python3
"""Draw the Tomoshibi flame character as grayscale PNG glyphs for the Ledger screen.

    python3 tools/draw_flame.py            # writes glyphs/ and icons/
    python3 tools/draw_flame.py sheet.png  # also writes a contact sheet to look at

The screen is black-and-white E Ink, so the character is line art: a small flame
with a face, sitting in a lamp dish. Each state is one 240x240 image.
"""
import math
import os
import sys

from PIL import Image, ImageDraw

SS = 4  # supersampling factor; shapes are drawn big and scaled down for clean edges
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def teardrop(cx, base_y, width, height, sway=0.0, n=120):
    """Outline of a flame: round at the bottom, pointed at the top.
    `sway` leans the tip sideways, as a fraction of the width."""
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = math.sin(t) * math.sin(t / 2) ** 1.6       # -0.5..0.5-ish, cusp at t=0
        y = (math.cos(t) + 1) / 2                      # 1 at the tip, 0 at the bottom
        lean = sway * width * y ** 2
        pts.append((cx + x * width + lean, base_y - y * height))
    return pts


class Canvas:
    def __init__(self, size=240):
        self.size = size
        self.img = Image.new("L", (size * SS, size * SS), 255)
        self.d = ImageDraw.Draw(self.img)

    def s(self, v):
        return v * SS

    def poly(self, pts, fill):
        self.d.polygon([(self.s(x), self.s(y)) for x, y in pts], fill=fill)

    def ellipse(self, cx, cy, rx, ry, fill):
        self.d.ellipse([self.s(cx - rx), self.s(cy - ry), self.s(cx + rx), self.s(cy + ry)], fill=fill)

    def line(self, pts, width, fill=0):
        p = [(self.s(x), self.s(y)) for x, y in pts]
        self.d.line(p, fill=fill, width=int(self.s(width)), joint="curve")
        r = self.s(width) / 2
        for x, y in (p[0], p[-1]):  # round caps
            self.d.ellipse([x - r, y - r, x + r, y + r], fill=fill)

    def arc(self, cx, cy, rx, ry, a0, a1, width, fill=0, steps=24):
        self.line([(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / steps)),
                    cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / steps))) for i in range(steps + 1)],
                  width, fill)

    def out(self, size=None):
        size = size or self.size
        return self.img.resize((size, size), Image.LANCZOS)


def dish(c, cx=120, y=196):
    """The lamp dish the flame sits in."""
    c.arc(cx, y - 6, 62, 30, 8, 172, 7)
    c.line([(cx - 62, y - 4), (cx + 62, y - 4)], 7)
    c.line([(cx - 22, y + 26), (cx + 22, y + 26)], 7)


def flame(c, height, width, sway=0.0, cx=120, base=188, stroke=8):
    c.poly(teardrop(cx, base, width, height, sway), 0)
    inner_h, inner_w = height - stroke * 2.4, width - stroke * 2.3
    c.poly(teardrop(cx, base - stroke, inner_w, inner_h, sway), 255)


def eyes_open(c, cx, cy, gap=24):
    for sx in (-1, 1):
        c.ellipse(cx + sx * gap, cy, 8, 10, 0)
        c.ellipse(cx + sx * gap - 3, cy - 4, 3, 3, 255)


def eyes_closed(c, cx, cy, gap=24):
    for sx in (-1, 1):
        c.arc(cx + sx * gap, cy - 2, 9, 7, 20, 160, 5)


def eyes_happy(c, cx, cy, gap=24):
    for sx in (-1, 1):
        c.arc(cx + sx * gap, cy + 6, 10, 10, 200, 340, 6)


def eyes_stern(c, cx, cy, gap=24):
    for sx in (-1, 1):
        c.ellipse(cx + sx * gap, cy + 2, 7, 8, 0)
        c.line([(cx + sx * (gap + 13), cy - 16), (cx + sx * (gap - 11), cy - 8)], 6)


def smile(c, cx, cy, w=10):
    c.arc(cx, cy, w, 7, 20, 160, 5)


def spark(c, x, y, r):
    c.line([(x - r, y), (x + r, y)], 4)
    c.line([(x, y - r), (x, y + r)], 4)


def asleep():
    c = Canvas(); dish(c); flame(c, 86, 104)
    eyes_closed(c, 120, 158); smile(c, 120, 170, 6)
    c.line([(170, 96), (186, 96), (170, 114), (186, 114)], 4)   # z
    c.line([(194, 62), (206, 62), (194, 76), (206, 76)], 3)     # z
    return c


def awake(sway):
    c = Canvas(); dish(c); flame(c, 150, 118, sway)
    eyes_open(c, 120, 148); smile(c, 120, 164)
    return c


def happy():
    c = Canvas(); dish(c); flame(c, 168, 126, 0.0)
    eyes_happy(c, 120, 146); c.ellipse(120, 168, 11, 9, 0); c.ellipse(120, 164, 13, 6, 255)
    spark(c, 34, 60, 13); spark(c, 208, 46, 10); spark(c, 214, 118, 8)
    return c


def guard():
    c = Canvas(); dish(c); flame(c, 160, 122, 0.0)
    eyes_stern(c, 120, 146); c.line([(108, 168), (132, 168)], 6)
    return c


def gone():
    """The flame is out: an empty dish and a thread of smoke."""
    c = Canvas(); dish(c)
    c.line([(120, 178), (120, 190)], 6)  # wick
    pts = [(120 + 14 * math.sin(i / 3.2), 166 - i * 5.4) for i in range(22)]
    c.line(pts, 4, 120)
    return c


FRAMES = {
    "flame_asleep": asleep,
    "flame_awake_a": lambda: awake(-0.06),
    "flame_awake_b": lambda: awake(0.06),
    "flame_happy": happy,
    "flame_guard": guard,
    "flame_gone": gone,
}


def main():
    made = {}
    for name, fn in FRAMES.items():
        img = fn().out()
        img.save(os.path.join(HERE, "glyphs", name + ".png"))
        made[name] = img
    # Small versions: 64px for the standard review and home screens, 40px for the app list.
    base = awake(0.0)
    base.out(64).save(os.path.join(HERE, "glyphs", "flame_64x64.png"))
    base.out(40).save(os.path.join(HERE, "icons", "flame_40x40.png"))
    base.out(32).save(os.path.join(HERE, "icons", "flame_32x32.png"))
    if len(sys.argv) > 1:
        sheet = Image.new("L", (250 * len(made) + 10, 260), 255)
        for i, img in enumerate(made.values()):
            sheet.paste(img, (10 + i * 250, 10))
        sheet.save(sys.argv[1])


if __name__ == "__main__":
    main()
