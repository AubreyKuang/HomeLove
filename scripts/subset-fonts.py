#!/usr/bin/env python3
"""Rebuild fonts/*.woff2 from the original OFL fonts, cut down to the characters
the game actually shows, so the page needs no font server.

    python3 scripts/subset-fonts.py --src /path/to/originals     # needs fonttools + brotli

The originals come from the Google Fonts repository (github.com/google/fonts,
commit 6ebe737e44fd64ee736bbc6feed6136a6dbfd222), folder ofl/<family>/:

    ZCOOLKuaiLe-Regular.ttf   ofl/zcoolkuaile         Chinese headings and names
    DotGothic16-Regular.ttf   ofl/dotgothic16         Japanese headings and names
    PixelifySans[wght].ttf    ofl/pixelifysans        English headings and names
    Silkscreen-Regular.ttf    ofl/silkscreen          key caps and the A button

All four are under the SIL Open Font License 1.1 without Reserved Font Names;
their licence files sit next to the subsets in fonts/. Run this again whenever
new text is added to lang/*.js or the scripts, so the headings never fall back
to a system font halfway through a word.
"""
import argparse, hashlib, re, sys
from pathlib import Path
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
FONTS = {
    # output name: (source file, sha256 of the original)
    'ZCOOLKuaiLe-subset.woff2': ('ZCOOLKuaiLe-Regular.ttf', '812a6fc1fe54b6d73a419245c32dfeba8aa33104d5be90d1cf6af082007cb71d'),
    'DotGothic16-subset.woff2': ('DotGothic16-Regular.ttf', '3ad9af88726d42b40f7f365f0dcac785af73cf20ea6f1d5b44e57cc21150b8f1'),
    'PixelifySans.woff2': ('PixelifySans[wght].ttf', '9ba86cd010a4de309d263ceff8e8044092c9db7efda869620cb9ff1c4389e8a5'),
    'Silkscreen.woff2': ('Silkscreen-Regular.ttf', 'c845473330b94c2079ce9af01c51ac8ba2d99c24f4d14c039843bbb8e642ebd8'),
}
# Store names drawn on the TapTap promo art, in case they ever differ from the game text.
EXTRA = '像素小屋·心动日常 Pixel Cottage ピクセル小屋'


def game_text():
    files = [ROOT / 'index.html', *ROOT.glob('*.js'), *ROOT.glob('js/*.js'), *ROOT.glob('lang/*.js'), ROOT / 'dev/panel.js']
    text = ''.join(f.read_text('utf8') for f in files) + EXTRA
    chars = {c for c in text if ord(c) > 0x7e and not c.isspace()}
    # JavaScript escapes such as … stand for characters too.
    chars |= {chr(int(h, 16)) for h in re.findall(r'\\u([0-9a-fA-F]{4})', text)}
    return ''.join(chr(c) for c in range(0x20, 0x7f)) + ''.join(sorted(chars))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, type=Path, help='folder holding the original font files')
    args = ap.parse_args()
    text = game_text()
    out = ROOT / 'fonts'
    for name, (source, digest) in FONTS.items():
        path = args.src / source
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            sys.exit(f'{path} is not the expected original')
        options = subset.Options()
        options.flavor = 'woff2'
        options.layout_features = ['*']
        options.name_IDs = ['*']
        options.notdef_outline = True
        font = subset.load_font(str(path), options)
        sub = subset.Subsetter(options)
        # Latin pixel fonts are small: keep every glyph. CJK fonts keep only what the game shows.
        if 'subset' in name:
            sub.populate(text=text)
        else:
            sub.populate(unicodes=font.getBestCmap().keys())
        sub.subset(font)
        subset.save_font(font, str(out / name), options)
        print(f'{name:<28}{len(font.getBestCmap()):>6} chars {(out / name).stat().st_size / 1024:>8.0f}KB')
    print(f'{len(text)} distinct characters in the game text')


if __name__ == '__main__':
    main()
