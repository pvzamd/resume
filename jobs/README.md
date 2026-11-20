# One-off resumes, one folder per job

The generic resume (`content.js` at the repo root, built into `dist/`) is never edited
for a single job. When a role is worth tailoring for, it gets its own folder here
instead, with its own v2 resume. **Delete the folder once the application is done**, so
an old tailored resume is never mistaken for the current one. The application record
lives in the private career feed (`career-feeds/job-search/job-applications.md`).

## Layout

```
jobs/
  <company>-<role>/          lowercase, hyphens: acme-senior-frontend-engineer
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

1. **Start `content.js` from the generic one.** Override only what changes, usually
   `title`, `profile`, the `jobs` bullets, `skills` and `keywords`. Anything not
   overridden (contact, links, projects, education) follows the generic resume:

   ```js
   // One-off resume for <Company>, <Role> (<role number>).
   // Build (v2 only, into this folder):  node build.js --job jobs/<folder>
   const base = require('../../content');

   module.exports = {
     ...base,
     title: '...',
     profile: '...',
     jobs: [{ ...base.jobs[0], bullets: ['...'] }, base.jobs[1], base.jobs[2]],
   };
   ```
2. **Tailor from real work only.** Reorder and reword to match the posting; don't invent
   experience.
3. **Keep it to one page.** v2 is the only output. Since 2026-11-21 (0.3in margins) the
   generic v2 has about 35pt to spare, two or three lines.
   - Keep the tailored text about as long as the generic: swap bullets rather than add
     them.
   - Each skills row has to fit on one line.
   - On the laptop, the PDF step warns if Word makes it more than one page.
4. **Build**, from the repo root:
   - Laptop: `node build.js --job jobs/<folder>`. Makes the DOCX and the PDF.
   - Office desktop: `node build.js --job jobs/<folder> --no-pdf`. DOCX only, since
     there's no Word there.
5. **Write `job.md`:** the link and role number, team, location, type, experience asked,
   what the role asks for (in your own words; don't paste the posting), what was
   tailored, gaps to prepare for, and status.
6. **Once the application is sent,** log it in the private applications log, then delete
   the folder. Git history keeps it if it's ever needed.

## Jobs

None open. The Apple one-off (Senior UI Engineer - Web, applied 2026-11-02) was removed
on 2026-11-21; it's in git history (last in commit `759b723`).
