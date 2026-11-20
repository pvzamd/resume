# Resume build

Edit `content.js`. Run `npm run build`. Get three versions as docx + pdf in `dist/`.

```
npm run build     # docx + pdf  (needs Word installed)
npm run docx      # docx only
```

Output: `parvez_ahmed_<version>_<yyyy-mm-dd>.{docx,pdf}`
`dist/` keeps only the latest set. Each build moves earlier days' files to
`dist/archive/` first (once the new build has passed the parity check, so a failed
build never leaves `dist/` empty). Same-day rebuilds overwrite that day's files.
If a file is open in Word or a PDF viewer, the move fails: close it and build again.

**One-off resume for a single job:** `node build.js --job jobs/<folder> [--no-pdf]`.
- It builds v2 only, from `<folder>/content.js` (usually overrides on top of the root
  `content.js`), into `<folder>/parvez_ahmed_resume.{docx,pdf}`.
- `dist/` and the generic resume are left alone, and there's no parity check.
- See `jobs/README.md`.

## Layout

```
content.js        <- the only file you normally edit
build.js          <- orchestrator
templates/v1,v3   <- pristine unzipped originals, never edited in place
lib/v1.js,v3.js   <- apply content.js onto the templates (design untouched)
lib/v2.js         <- generates v2 from scratch (single column, ATS-first)
lib/parity.js     <- fails the build if the three versions drift apart
dist/             <- output: the latest set only
dist/archive/     <- earlier sets, moved here by the build
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
- **Extra links in v1/v3.** A `[[link]]` beyond the ones its template paragraph
  already has gets a new hyperlink in the build copy, pointing at its URL in
  `links` (e.g. `[[certificate]]` in the Learnings project). Template links are
  reused by position, so the existing ones still need to stay in order.
- **The website line (`contact.website`) needs layout help in v1 and v3.** v1's
  template has only LinkedIn and GitHub rows, so the build copies the GitHub box one
  row lower (text only: there's no website icon) and moves the Skills sidebar down a
  row. v3 is stacked two-column sections, so a longer Contact list pushes the whole
  page down; its contact lines lose their 3pt gaps to keep the block the same height.
  v2 shows the contact details on two lines.
- **v3's vertical spacing is set in `lib/v3.js`** ("Vertical spacing", with the
  numbers in `SPACE`). Its left column ends at a column break, so if the left column
  grows past the page, Experience jumps to page 2 (the build's page-count warning
  catches it). As of 2026-11-21 the left column has about 45pt to spare, the right
  column about 20pt.
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
