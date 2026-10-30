# Resume build

Edit `content.js`. Run `npm run build`. Get three versions as docx + pdf in `dist/`.

```
npm run build     # docx + pdf  (needs Word installed)
npm run docx      # docx only
```

Output: `parvez_ahmed_<version>_<yyyy-mm-dd>.{docx,pdf}`
Same-day rebuilds overwrite that day's files; a new day starts a new set.

## Layout

```
content.js        <- the only file you normally edit
build.js          <- orchestrator
templates/v1,v3   <- pristine unzipped originals, never edited in place
lib/v1.js,v3.js   <- apply content.js onto the templates (design untouched)
lib/v2.js         <- generates v2 from scratch (single column, ATS-first)
lib/parity.js     <- fails the build if the three versions drift apart
dist/             <- output
```

## What goes where in content.js

| Field | Used by |
|---|---|
| `name`, `title`, `contact` | header of all three |
| `profile` | Summary / Profile section |
| `jobs[].bullets` | experience bullets, in array order |
| `projects`, `skills`, `education` | matching sections |
| `links` | hyperlink targets, keyed by the visible text |

`**bold**` and `[[Link Text]]` work inside any string. `[[Link Text]]` must have a
matching key in `links`.

## Constraints worth knowing before you edit

- **v1 and v3 fill fixed template slots.** The templates have Alice Blue 6,
  Software AG 5 and CrowInfo 1 bullet slots, 9 skill rows and 3 education rows.
  A job with fewer bullets drops its spare slots; extra bullets are cloned after
  the job's last slot (without hyperlinks). Skills and education counts are still
  fixed. v2 grows freely.
- **The first two Alice Blue bullets carry hyperlinks** — slot 1 has one link,
  slot 2 has two. Keep `[[Rise]]` in the first and
  `[[Corporate Website]]`/`[[TradeSchool]]` in the second, or reorder v1.js and
  v3.js to match.
- **v2 is sized to fill one A4 page.** Adding a few lines pushes it to two. The
  build prints a warning if any pdf comes out over one page.
- **No Word on this machine?** `python tools/fitcheck.py` simulates Word's line
  wrapping and compares each layout's line count with the last Word-made PDFs
  (`dist/*_2026-08-01.pdf`). Needs fontTools and PyMuPDF.
- **Send v1 as PDF, never as .docx.** Its content lives in floating text boxes,
  so a .docx text parser reads it as empty. The PDF extracts fine.

## Parity check

The build fails if the three versions disagree — either a version is missing a
sentence, or one still shows stale template text. It compares the *rendered*
versions against each other, so it will not catch a typo you make in
`content.js` (that propagates to all three identically).
