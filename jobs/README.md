# One-off resumes, one folder per job

The generic resume (`content.js` at the repo root, built into `dist/`) is never edited
for a single job. When a role is worth tailoring for, it gets its own folder here
instead, with its own v2 resume.

## Layout

```
jobs/
  <company>-<role>/          lowercase, hyphens: apple-senior-ui-engineer-web
    job.md                   link, role number, location, what the role asks, what
                             was tailored, interview gaps, status
    content.js               overrides on top of the root content.js
    parvez_ahmed_resume.docx built; one copy, overwritten on every rebuild
    parvez_ahmed_resume.pdf  built on the laptop (Word); this is what gets uploaded
    job-posting.pdf          optional: the posting saved from the browser
```

**This repo is public.** Pay, notice period and other form answers never go here; they
stay in the private notes.

## Making one

1. **Copy an existing folder's `content.js`.** It starts with `require('../../content')`
   and overrides only what changes: usually `title`, `profile`, the `jobs` bullets,
   `skills` and `keywords`. Anything not overridden (contact, links, projects,
   education) follows the generic resume.
2. **Tailor from real work only.** Reorder and reword to match the posting; don't invent
   experience.
3. **Keep it to one page.** v2 is the only output. In the 2026-10-30 PDF it has about
   18pt to spare, roughly one line.
   - Keep the tailored text about as long as the generic: swap bullets rather than add
     them.
   - Each skills row has to fit on one line.
   - On the laptop, the PDF step warns if Word makes it more than one page.
4. **Build**, from the repo root:
   - Laptop: `node build.js --job jobs/<folder>`. Makes the DOCX and the PDF.
   - Office desktop: `node build.js --job jobs/<folder> --no-pdf`. DOCX only, since
     there's no Word there.
5. **Write `job.md`,** using the Apple one as the template. Summarise the posting in your
   own words; don't paste it.
6. **Once the application is sent,** update the status table in `job.md` and the
   table below.

## Jobs

| Folder | Company | Role | Location | Status |
| :-- | :-- | :-- | :-- | :-- |
| `apple-senior-ui-engineer-web/` | Apple (IS&T, Retail and Marcom Engineering) | Senior UI Engineer - Web, 200690650-0321 | Bengaluru | Applied 2026-11-02 |
