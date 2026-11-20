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

const doc = new Doc(process.argv[2], S, { links: C.links });
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
// The template has no website line: copy the GitHub line's paragraph right under it.
// cloneAfter() drops hyperlinks, so set() then adds the site's link as a new one.
if (doc.cloneAfter(/^github\.com/, '__SITE__', { styles: S_CONTACT }) !== 1) throw new Error('website line: GitHub line not found once');
d.set(/^__SITE__$/, `[[${C.contact.website}]]`, { styles: S_CONTACT });
// v3 is stacked two-column sections, and Contact | Profile is one of them: a longer
// Contact list pushes everything below it down, and the page then runs to two pages.
// The contact lines lose their 3pt gaps instead, so the block (one line longer) is as
// tall as it was, and the rest of the page stays exactly where it was.
{
  const { PARA_RE, plainText } = require('./docxedit');
  const starts = [C.contact.linkedin, C.contact.github, C.contact.website, 'Email:', 'Mobile:'];
  let tightened = 0;
  doc.xml = doc.xml.replace(PARA_RE, (p) => {
    if (!starts.some((s) => plainText(p).startsWith(s)) || !p.includes('<w:spacing w:after="60"')) return p;
    tightened++;
    return p.replace('<w:spacing w:after="60"', '<w:spacing w:after="0"');
  });
  if (tightened !== starts.length) throw new Error(`contact spacing: tightened ${tightened} of ${starts.length} lines`);
}
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

// ---- Vertical spacing ----------------------------------------------------
// v3 is stacked two-column sections. "Profile" and "Experience" each start with a
// column break, and the empty bit of their paragraph before the break still takes a
// full 10pt line at the foot of the left column: that line was most of the gap
// under Contact, and it sat under Education too. The break runs are set in 1pt type
// so that line all but disappears. The gap under the Contact | Profile row comes from
// space after the last line of each of its columns (Address, and the Profile text),
// so Skills and Experience start together whichever column is taller. (Space before
// Experience would be ignored: Word drops it at the top of a column after a break.)
// Education gets a smaller gap above it, and the skill rows sit closer together.
{
  const { PARA_RE, plainText } = require('./docxedit');
  const SPACE = { underTopRow: 160, aboveEducation: 160, betweenSkills: 60 }; // twips (20 = 1pt)
  const patch = (what, expect, pred, fn) => {
    let n = 0;
    doc.xml = doc.xml.replace(PARA_RE, (p) => {
      if (!pred(plainText(p).trim(), p)) return p;
      const q = fn(p);
      if (q === p) throw new Error(`spacing: nothing changed in ${what}`);
      n++;
      return q;
    });
    if (n !== expect) throw new Error(`spacing: ${what}: expected ${expect} paragraphs, got ${n}`);
    doc.log.push(`spacing: ${what} x${n}`);
  };
  const BREAK_RUN = /<w:r>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:br w:type="column"\/><\/w:r>/;
  patch('column breaks in 1pt type', 2, (t, p) => BREAK_RUN.test(p),
    (p) => p.replace(BREAK_RUN, '<w:r><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr><w:br w:type="column"/></w:r>'));
  patch('space under the Contact | Profile row', 2, (t) => t.startsWith('Address:') || t === C.profile,
    (p) => p.replace('<w:spacing w:after="0"', `<w:spacing w:after="${SPACE.underTopRow}"`));
  patch('space above Education', 1, (t) => t === 'Education',
    (p) => p.replace('<w:spacing w:before="240"', `<w:spacing w:before="${SPACE.aboveEducation}"`));
  const labels = C.skills.map(([label]) => `${label}:`);
  patch('space between skill rows', C.skills.length, (t) => labels.some((l) => t.startsWith(l)),
    (p) => p.replace('<w:spacing w:after="120"', `<w:spacing w:after="${SPACE.betweenSkills}"`));
}

doc.save(process.argv[2]);
console.log(doc.log.join('\n'));
console.log('\nv3 edits applied: ' + doc.log.length);
