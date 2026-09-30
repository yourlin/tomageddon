"""宣传视频叠加层：标题、分段字幕、片尾（1920×1080 透明 PNG）。
用法：python3 scripts/promo/overlays.py zh|en   → promo/overlay/ 或 promo/overlay-en/
需要 Pillow；二维码 promo/overlay/qr.png 由 npm run promo:overlays 先行生成。
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

LANG = sys.argv[1] if len(sys.argv) > 1 else "zh"
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
OUT = os.path.join(ROOT, "promo", "overlay" if LANG == "zh" else "overlay-en")
QR = os.path.join(ROOT, "promo", "overlay", "qr.png")
os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"


def font(size):
    return ImageFont.truetype(FONT, size)


# 分段字幕：(文件名, 主标题, 副标题, 强调色)
CAPTIONS = {
    "zh": [
        ("cap_combat", "一刀清屏，越打越爽", "Mow down endless hordes", "#ff4b3e"),
        ("cap_boss", "45 名精英与 Boss", "45 elites & bosses", "#b5179e"),
        ("cap_levelup", "升级构筑，每局都不一样", "A new build every run", "#52b788"),
        ("cap_shop", "564 件道具 · 18 种武器", "564 items · 18 weapons", "#ffb703"),
        ("cap_forge", "洗词条 · 打造 +10", "Reroll affixes · Forge to +10", "#9d4edd"),
        ("cap_unlock", "33 名角色 · 成就解锁", "33 heroes to unlock", "#3a86ff"),
    ],
    "en": [
        ("cap_combat", "Mow Down Endless Hordes", "One ultimate clears the screen", "#ff4b3e"),
        ("cap_boss", "45 Elites & Bosses", "New foes every run", "#b5179e"),
        ("cap_levelup", "Build As You Fight", "A new combo every run", "#52b788"),
        ("cap_shop", "564 Items · 18 Weapons", "Buy, combine, stack up", "#ffb703"),
        ("cap_forge", "Reroll Affixes · Forge to +10", "Chase the perfect weapon", "#9d4edd"),
        ("cap_unlock", "33 Heroes to Unlock", "Earned through achievements", "#3a86ff"),
    ],
}


def caption(name, main, sub, accent):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    probe = ImageDraw.Draw(im)
    fm, fs = font(70), font(38)
    bw = int(max(probe.textlength(main, font=fm), probe.textlength(sub, font=fs))) + 110
    x0, y0 = 80, H - 250

    def draw(d, shadow):
        d.rounded_rectangle([x0, y0, x0 + bw, y0 + 170], radius=26, fill=(20, 6, 8, 160 if shadow else 215))
        if shadow:
            return
        d.rounded_rectangle([x0, y0, x0 + 16, y0 + 170], radius=8, fill=accent)
        d.text((x0 + 50, y0 + 22), main, font=fm, fill=(255, 255, 255), stroke_width=3, stroke_fill=(20, 6, 8))
        d.text((x0 + 52, y0 + 108), sub, font=fs, fill=(255, 209, 102))

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw(ImageDraw.Draw(shadow), True)
    im.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(10)))
    draw(ImageDraw.Draw(im), False)
    im.save(os.path.join(OUT, f"{name}.png"))


def title():
    im = Image.new("RGBA", (W, H), (15, 4, 6, 120))
    d = ImageDraw.Draw(im)

    def ctext(y, t, f, fill, stroke=0):
        w = d.textlength(t, font=f)
        d.text(((W - w) / 2, y), t, font=f, fill=fill, stroke_width=stroke, stroke_fill=(20, 6, 8))

    if LANG == "zh":
        ctext(250, "番茄酱", font(260), (255, 75, 62), 16)
        ctext(560, "TOMAGEDDON", font(96), (255, 209, 102), 6)
        ctext(710, "肉鸽割草 · 一局就上头", font(64), (255, 244, 234), 4)
        ctext(800, "Roguelike survivor — just one more run", font(40), (255, 209, 102), 3)
    else:
        ctext(330, "TOMAGEDDON", font(190), (255, 75, 62), 14)
        ctext(600, "A roguelike survivor", font(72), (255, 244, 234), 4)
        ctext(700, "Just one more run.", font(56), (255, 209, 102), 3)
    im.save(os.path.join(OUT, "title.png"))


def end():
    im = Image.new("RGBA", (W, H), (15, 4, 6, 150))
    d = ImageDraw.Draw(im)
    tomato = Image.open(os.path.join(ROOT, "docs", "images", "char", "tomato.png")).convert("RGBA").resize((360, 360), Image.LANCZOS)
    im.alpha_composite(tomato, (170, 300))
    if LANG == "zh":
        d.text((600, 250), "番茄酱", font=font(200), fill=(255, 75, 62), stroke_width=12, stroke_fill=(20, 6, 8))
        d.text((610, 480), "TOMAGEDDON", font=font(80), fill=(255, 209, 102), stroke_width=5, stroke_fill=(20, 6, 8))
        d.text((610, 610), "立即畅玩 · Play now", font=font(64), fill=(255, 255, 255), stroke_width=4, stroke_fill=(20, 6, 8))
        lines = [("打开浏览器即玩，无需下载", font(38), (255, 244, 234)), ("Free to play in your browser", font(34), (255, 244, 234))]
        scan = "扫码开玩 · Scan to play"
    else:
        size = 130
        while d.textlength("TOMAGEDDON", font=font(size)) > 760:  # 不压到右侧二维码
            size -= 2
        big = font(size)
        d.text((600, 320), "TOMAGEDDON", font=big, fill=(255, 75, 62), stroke_width=9, stroke_fill=(20, 6, 8))
        d.text((610, 490), "Play now", font=font(88), fill=(255, 255, 255), stroke_width=5, stroke_fill=(20, 6, 8))
        lines = [("Free · in your browser · no download", font(40), (255, 244, 234))]
        scan = "Scan to play"
    y = 700
    for t, f, c in lines + [("yourlin.github.io/tomageddon", font(42), (255, 209, 102))]:
        assert d.textlength(t, font=f) < 760, t
        d.text((610, y), t, font=f, fill=c)
        y += 56
    qr = Image.open(QR).convert("RGBA").resize((380, 380), Image.NEAREST)
    d.rounded_rectangle([1400, 330, 1820, 800], radius=30, fill=(255, 244, 234, 255))
    im.alpha_composite(qr, (1420, 350))
    f = font(32)
    d.text((1400 + (420 - d.textlength(scan, font=f)) / 2, 745), scan, font=f, fill=(179, 38, 30))
    im.save(os.path.join(OUT, "end.png"))


for c in CAPTIONS[LANG]:
    caption(*c)
title()
end()
print(f"overlays ({LANG}) → {os.path.relpath(OUT, ROOT)}")
