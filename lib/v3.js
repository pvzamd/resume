// v3 — content-only rewrite. The two-column Century Gothic layout is untouched.
const { Doc } = require('./docxedit');
const C = require('../content');

const F = '<w:rFonts w:ascii="Century Gothic" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Century Gothic"/>';
const TAIL = '<w:kern w:val="0"/><w:sz w:val="20"/><w:szCs w:val="20"/><w14:ligatures w14:val="none"/>';
const GREY = '<w:color w:val="404040" w:themeColor="text1" w:themeTint="BF"/>';
const DARK = '<w:color w:val="0D0D0D" w:themeColor="text1" w:themeTint="F2"/>';
const BLUE = '<w:color w:val="4472C4" w:themeColor="accent1"/>';

const S = {
  base: `<w:rPr>${F}${GREY}${TAIL}</w:rPr>`,
  strong: `<w:rPr>${F}${DARK}${TAIL}</w:rPr>`,
  link: `<w:rPr><w:rStyle w:val="Hyperlink"/>${F}${BLUE}${TAIL}</w:rPr>`,
};
// company/date header: hyperlinked company in bold blue
const S_CO = {
  base: `<w:rPr>${F}${GREY}${TAIL}</w:rPr>`,
  strong: `<w:rPr>${F}${DARK}${TAIL}</w:rPr>`,
  link: `<w:rPr><w:rStyle w:val="Hyperlink"/>${F}<w:b/><w:bCs/>${BLUE}${TAIL}</w:rPr>`,
};

const doc = new Doc(process.argv[2], S);
const d = {
  set: (m, markup, opts = {}) => doc.set(m, markup, Object.assign({ expect: 1 }, opts)),
};

// ---- Header --------------------------------------------------------------
d.set(/^Developer \| Senior Software Engineer/, C.title, {
  styles: { base: '<w:rPr><w:szCs w:val="32"/></w:rPr>', strong: '<w:rPr><w:szCs w:val="32"/></w:rPr>', link: S.link },
});

// ---- Contact -------------------------------------------------------------
const S_CONTACT = {
  base: `<w:rPr>${F}${GREY}${TAIL}</w:rPr>`,
  strong: `<w:rPr>${F}${DARK}${TAIL}</w:rPr>`,
  link: `<w:rPr><w:rStyle w:val="Hyperlink"/>${F}${BLUE}${TAIL}</w:rPr>`,
};
d.set(/^linkedin\.com/, `[[${C.contact.linkedin}]]`, { styles: S_CONTACT });
d.set(/^github\.com/, `[[${C.contact.github}]]`, { styles: S_CONTACT });
d.set(/^Mobile: /, `Mobile: **${C.contact.phone}**`, { styles: S_CONTACT });
d.set(/^Address: /, `Address: ${C.contact.location}`, { styles: S_CONTACT });

// ---- Profile -------------------------------------------------------------
d.set(/^Frontend Engineer with more than 4 years/, C.profile, {
  styles: { base: '<w:rPr>' + GREY + '</w:rPr>', strong: '<w:rPr>' + DARK + '</w:rPr>', link: S.link },
});

// ---- Skills --------------------------------------------------------------
const oldSkills = [
  /^Frontend: /, /^Languages: /, /^Backend: /, /^UI & Styling: /,
  /^Integration: /, /^Databases: /, /^Cloud & Server: /, /^Tools: /,
  /^Design Principles: /,
];
oldSkills.forEach((re, i) => {
  const [label, value] = C.skills[i];
  d.set(re, `**${label}:** ${value}`);
});

// ---- Education (three lines per entry, joined by soft breaks) -------------
[/^Master of Computer Application/, /^Bachelor of Computer Application/, /^Diploma in Civil Engineering/]
  .forEach((re, i) => {
    const e = C.education[i];
    d.set(re, `**${e.degree}**\n${e.school}\n${e.years} | ${e.score}`);
  });

// ---- Experience headers --------------------------------------------------
for (const j of C.jobs) {
  d.set(new RegExp('^' + j.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\|'),
    `[[${j.company}]]${j.suffix} | **${j.role}** | **${j.dates}**`, { styles: S_CO });
}

// ---- Experience bullets --------------------------------------------------
const bulletMap = [
  [/^Re-architected and built Rise/, 0, 0],
  [/^Developing the Corporate Website/, 0, 1],
  [/^Maintaining Node\.js APIs/, 0, 2],
  [/^Enhanced maintainability in Partner Dashboard/, 0, 3],
  [/^Managed deployment setup/, 0, 4],
  [/^Wrote unit tests using Vitest/, 0, 5],
  [/^Developed Node\.js plugins/, 1, 0],
  [/^Built and maintained multi-platform integration bots/, 1, 1],
  [/^Migrated AppHub/, 1, 2],
  [/^Refactored legacy codebase to ES6\+/, 1, 3],
  [/^Integrated third-party SaaS platforms/, 1, 4],
  [/^Developed and maintained client web applications/, 2, 0],
];
// A job with fewer bullets than slots loses its spare slots; removal runs before
// any set(), because remove() resets the record of already-written paragraphs.
for (const [re, job, slot] of bulletMap) {
  if (slot >= C.jobs[job].bullets.length) {
    const hits = doc.remove(re);
    if (hits !== 1) throw new Error(`remove(): expected 1 match, got ${hits} for: ${re}`);
  }
}
for (const [re, job, slot] of bulletMap) {
  if (slot < C.jobs[job].bullets.length) d.set(re, C.jobs[job].bullets[slot]);
}

// ---- Projects ------------------------------------------------------------
d.set(/^pnl-heatmap \(NPM Package\)/, C.projects[0], { styles: S_CO });
d.set(/^Dual-Hangman Game/, C.projects[1], { styles: S_CO });

// ---- Experience: bullets beyond the template's slots -----------------------
// Cloned after the job's last filled slot, so they need no hyperlinks. Done last:
// cloneAfter() resets the written-paragraph record, which would let an earlier
// set() rule re-match text it had already written.
const plain = (m) => m.replace(/\*\*|\[\[|\]\]/g, '');
C.jobs.forEach((j, job) => {
  const slots = bulletMap.filter(([, jb]) => jb === job).length;
  for (let i = slots; i < j.bullets.length; i++) {
    const hits = doc.cloneAfter(plain(j.bullets[i - 1]), j.bullets[i]);
    if (hits !== 1) throw new Error(`cloneAfter(): expected 1 match, got ${hits} for bullet ${i}`);
  }
});

doc.save(process.argv[2]);
console.log(doc.log.join('\n'));
console.log('\nv3 edits applied: ' + doc.log.length);
