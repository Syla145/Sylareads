"""Cuts font files down to the characters a page really uses and merges them
into one woff2 file (used by tools/script-fonts.mjs for Chinese, Japanese,
Korean and Tibetan, where the font packages ship dozens of large slices).

  python3 tools/subset-font.py OUT.woff2 "U+4E00,U+65E5" IN1.woff2 [IN2.woff2 ...]

Needs: pip install fonttools brotli
"""
import io
import sys

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont


def main():
    out, codes, *inputs = sys.argv[1:]
    wanted = {int(c.strip()[2:], 16) for c in codes.split(',') if c.strip()}
    parts = []
    for path in inputs:
        font = TTFont(path)
        have = set(font.getBestCmap().keys()) & wanted
        if not have:
            continue
        opts = subset.Options()
        opts.layout_features = ['*']  # keep shaping (Tibetan stacks, CJK forms)
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        opts.flavor = None
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=have)
        sub.subset(font)
        buf = io.BytesIO()
        font.save(buf)
        buf.seek(0)
        parts.append(buf)
    if not parts:
        sys.exit('no glyphs for ' + out)
    if len(parts) == 1:
        font = TTFont(parts[0])
    else:
        font = Merger().merge(parts)
    font.flavor = 'woff2'
    font.save(out)


if __name__ == '__main__':
    main()
