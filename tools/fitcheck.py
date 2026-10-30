#!/usr/bin/env python3
"""One-page check without Word: simulate Word's line wrapping for content.js and
compare line totals per layout with the last Word-made PDFs (dist/*_2026-08-01.pdf).

    python tools/fitcheck.py [content.js]

Needs Node (to read content.js), fontTools and PyMuPDF. Calibri / Calibri Light
come from C:/Windows/Fonts; Century Gothic (v3) is read from the embedded subset in
the v3 PDF. Column widths below were calibrated on 2026-10-30 from every line break
in the 2026-08-01 PDFs, and the simulator reproduces all of those PDFs' paragraph
line counts exactly. Paragraph count per column must stay the same for a fair
comparison: moving a bullet between jobs is fine, adding a bullet overall is not.
"""
import io
import json
import re
import subprocess
import sys
from pathlib import Path

import fitz
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
V3_PDF = ROOT / 'dist' / 'parvez_ahmed_3_2026-08-01.pdf'

# Line totals of the 2026-08-01 PDFs, which Word rendered on one page.
# Estimated spare room beyond them (from page/text-box geometry): v1 main ~4 lines,
# v1 sidebar ~1 (treat as none), v2 ~1, v3 ~2 (both columns).
BASELINE = {'v1 main': 31, 'v2 main': 27, 'v3 main': 39, 'v1 sidebar': 25, 'v3 sidebar': 22}
SLACK = {'v1 main': 4, 'v2 main': 1, 'v3 main': 2, 'v1 sidebar': 0, 'v3 sidebar': 2}


def load_font(src):
    f = TTFont(src) if isinstance(src, str) else TTFont(io.BytesIO(src))
    return {'cmap': f.getBestCmap() or {}, 'hmtx': f['hmtx'].metrics, 'upm': f['head'].unitsPerEm}


def gothic():
    doc = fitz.open(str(V3_PDF))
    best = None
    for xref, _, _, base, _, _ in doc[0].get_fonts():
        if base.endswith('+CenturyGothic'):
            f = load_font(doc.extract_font(xref)[3])
            if best is None or len(f['cmap']) > len(best['cmap']):
                best = f
    return best


FONTS = {
    'calibri': load_font('C:/Windows/Fonts/calibri.ttf'),
    'calibri-b': load_font('C:/Windows/Fonts/calibrib.ttf'),
    'calibri-l': load_font('C:/Windows/Fonts/calibril.ttf'),
    'gothic': gothic(),
}


def width(text, font, size):
    f, w = FONTS[font], 0.0
    for ch in text:
        g = f['cmap'].get(ord(ch))
        if g is None:  # glyph missing from the PDF subset (e.g. "~"): approximate
            c = FONTS['calibri']
            g2 = c['cmap'].get(ord(ch))
            w += (c['hmtx'][g2][0] / c['upm'] * 1.25 if g2 else 0.5) * size
        else:
            w += f['hmtx'][g][0] / f['upm'] * size
    return w


# Break opportunities: after spaces, and after a hyphen or en dash inside a word.
PIECE_RE = re.compile(r'[^ \-\u2013]*[\-\u2013]+(?=[^ ])|[^ ]+ *| +')


def runs(markup, font, bold_font=None):
    out = []
    for m in re.finditer(r'\*\*([\s\S]*?)\*\*|\[\[([\s\S]*?)\]\]|([^*\[]+|[*\[])', markup):
        if m.group(1) is not None:
            out.append((m.group(1), bold_font or font))
        else:
            out.append((m.group(2) if m.group(2) is not None else m.group(3), font))
    return out


def lines(markup, font, size, w, w_first=None, bold_font=None):
    toks = []
    for text, f in runs(markup, font, bold_font):
        for p in PIECE_RE.findall(text):
            toks.append([p, width(p, f, size), width(p.rstrip(' '), f, size)])
    merged = []  # glue pieces split only by a run boundary
    for t in toks:
        if merged and not merged[-1][0].endswith(' ') and not re.search(r'[\-\u2013]$', merged[-1][0]):
            m = merged[-1]
            merged[-1] = [m[0] + t[0], m[1] + t[1], m[1] + t[2]]
        else:
            merged.append(t)
    n, cur, limit = 0, 0.0, (w_first or w)
    started = False
    for p, wt, wc in merged:
        if started and cur + wc > limit + 1e-6:
            n, cur, limit = n + 1, 0.0, w
        cur += wt
        started = True
    return n + 1 if started else 0


# Calibrated text widths in pt, as [lo, hi) ranges; a paragraph whose line count
# differs across the range is reported as ambiguous.
MAIN = {  # bullet text width; unindented paragraphs get the extra width
    'v1': ('calibri-l', 10.0, None, (428.76, 433.67), {'profile': 0.0, 'project': 0.0}),
    'v2': ('calibri', 9.5, 'calibri-b', (511.49, 516.91), {'profile': 11.35, 'project': 0.0}),
    'v3': ('gothic', 10.0, None, (393.14, 395.92), {'profile': 9.0, 'project': 9.0}),
}
SIDE = {  # skills rows: first line, continuation lines
    'v1': ('calibri-l', (109.27, 114.17), (110.96, 122.56)),
    'v3': ('gothic', (145.93, 153.28), (145.93, 153.28)),
}


def spread(rng):
    lo, hi = rng
    return [lo + 0.01, (lo + hi) / 2, hi - 0.01]


def main():
    path = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'content.js').resolve()
    C = json.loads(subprocess.run(
        ['node', '-e', f'console.log(JSON.stringify(require({json.dumps(str(path))})))'],
        capture_output=True, text=True, check=True).stdout)

    totals, ambiguous = {}, []
    for L, (font, size, bold, rng, extra) in MAIN.items():
        paras = [('profile', C['profile'], extra['profile'])]
        paras += [(f"{j['company'][:12]} #{i + 1}", b, 0.0)
                  for j in C['jobs'] for i, b in enumerate(j['bullets'])]
        paras += [(f'project #{i + 1}', p, extra['project']) for i, p in enumerate(C['projects'])]
        total = 0
        for name, m, ex in paras:
            ns = {lines(m, font, size, w + ex, bold_font=bold) for w in spread(rng)}
            total += max(ns)
            if len(ns) > 1:
                ambiguous.append(f'{L} {name}: {min(ns)} or {max(ns)} lines')
        totals[f'{L} main'] = total
    for L, (font, first, cont) in SIDE.items():
        total = 0
        for label, val in C['skills']:
            m = f'**{label}:** {val}'
            ns = {lines(m, font, 10.0, wc, wf) for wf, wc in zip(spread(first), spread(cont))}
            total += max(ns)
            if len(ns) > 1:
                ambiguous.append(f'{L} skills "{label}": {min(ns)} or {max(ns)} lines')
        totals[f'{L} sidebar'] = total

    worst = 'ok'
    for k, n in totals.items():
        over = n - BASELINE[k]
        if over <= 0:
            verdict = 'ok'
        elif over <= SLACK[k]:
            verdict, worst = f'+{over} (inside estimated slack of {SLACK[k]})', 'check' if worst == 'ok' else worst
        else:
            verdict, worst = f'+{over} OVER', 'over'
        print(f'{k:11} {n:3} lines (baseline {BASELINE[k]})  {verdict}')
    for a in ambiguous:
        print('  ambiguous: ' + a)
    print({'ok': 'FITS: no layout exceeds its proven baseline.',
           'check': 'PROBABLY FITS: over the baseline but inside the estimated slack; confirm with a real PDF.',
           'over': 'DOES NOT FIT: trim the paragraphs above.'}[worst])
    sys.exit(1 if worst == 'over' else 0)


if __name__ == '__main__':
    main()
