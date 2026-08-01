// v1 — content-only rewrite. The blue two-column template is left untouched.
// Content lives twice in this file (txbxContent + mc:Fallback), so every edit
// is applied to both copies; hyperlink r:ids differ per copy and are preserved.
const { Doc } = require('./docxedit');
const C = require('../content');

const FONT = '<w:rFonts w:ascii="Calibri Light" w:eastAsia="Calibri" w:hAnsi="Calibri Light" w:cs="Calibri"/>';
const MAJOR = '<w:rFonts w:asciiTheme="majorHAnsi" w:hAnsiTheme="majorHAnsi" w:cstheme="majorHAnsi"/>';

const S = {
  base: `<w:rPr>${FONT}<w:noProof/><w:color w:val="464646"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`,
  strong: `<w:rPr>${MAJOR}<w:color w:val="0D0D0D" w:themeColor="text1" w:themeTint="F2"/><w:sz w:val="20"/><w:szCs w:val="18"/></w:rPr>`,
  link: `<w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light" w:cs="Calibri Light"/><w:color w:val="00B0F0"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr>`,
};
// company header line: hyperlinked company in heading font
const S_CO = {
  base: `<w:rPr>${MAJOR}<w:color w:val="0D0D0D" w:themeColor="text1" w:themeTint="F2"/><w:sz w:val="20"/><w:szCs w:val="18"/></w:rPr>`,
  strong: `<w:rPr>${MAJOR}<w:color w:val="0D0D0D" w:themeColor="text1" w:themeTint="F2"/><w:b/><w:sz w:val="20"/><w:szCs w:val="18"/></w:rPr>`,
  link: `<w:rPr>${MAJOR}<w:color w:val="00B0F0"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr>`,
};
// blue bold role heading (bullet image kept via keepLeading)
const S_ROLE = {
  base: `<w:rPr>${FONT}<w:b/><w:bCs/><w:noProof/><w:color w:val="00B0F0"/></w:rPr>`,
  strong: `<w:rPr>${FONT}<w:b/><w:bCs/><w:noProof/><w:color w:val="00B0F0"/></w:rPr>`,
  link: S.link,
};
// sidebar (skills)
const SIDE_FONT = '<w:rFonts w:ascii="Calibri Light" w:eastAsia="+mn-ea" w:hAnsi="Calibri Light" w:cs="+mn-cs"/>';
const S_SIDE = {
  base: `<w:rPr>${SIDE_FONT}<w:noProof/><w:color w:val="5E5E5E"/><w:sz w:val="20"/><w:szCs w:val="18"/></w:rPr>`,
  strong: `<w:rPr>${MAJOR}<w:color w:val="0D0D0D" w:themeColor="text1" w:themeTint="F2"/><w:sz w:val="20"/><w:szCs w:val="18"/></w:rPr>`,
  link: S.link,
};
// education: blue degree name, grey detail
const S_EDU = {
  base: `<w:rPr>${FONT}<w:noProof/><w:color w:val="464646"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`,
  strong: `<w:rPr>${FONT}<w:noProof/><w:color w:val="00B0F0"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`,
  link: S.link,
};

const doc = new Doc(process.argv[2], S);
// Every visible paragraph exists exactly twice (textbox + fallback); assert it,
// so a silently missed or double-applied edit fails the build.
const d = {
  set: (m, markup, opts = {}) => doc.set(m, markup, Object.assign({ expect: 2 }, opts)),
  remove: (m) => doc.remove(m),
  cloneAfter: (a, markup, opts) => doc.cloneAfter(a, markup, opts),
  raw: (f, r) => doc.raw(f, r),
  save: (p) => doc.save(p),
  log: doc.log,
};

// ---- Profile -------------------------------------------------------------
d.set(/^Frontend Engineer with more than 4 years/, C.profile);

// ---- Experience: role headings ------------------------------------------
d.set(/^ ?Senior Software Engineer$/, C.jobs[0].role, { styles: S_ROLE, keepLeading: 2 });
d.set(/^ ?Software Engineer$/, C.jobs[1].role, { styles: S_ROLE, keepLeading: 2 });
d.set(/^ ?Web Developer ?$/, C.jobs[2].role, { styles: S_ROLE, keepLeading: 2 });

// ---- Experience: company | dates ----------------------------------------
for (const j of C.jobs) {
  d.set(new RegExp('^' + j.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\|'),
    `[[${j.company}]]${j.suffix} | ${j.dates}`, { styles: S_CO });
}

// ---- Experience: bullets -------------------------------------------------
const oldBullets = [
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
  [/^Developed and maintained multiple client web applications/, 2, 0],
];
// Bullet order in content.js is chosen so each new bullet lands in a slot with a
// matching hyperlink count (Alice Blue slot 0 -> 1 link, slot 1 -> 2 links, rest 0).
for (const [re, job, slot] of oldBullets) {
  d.set(re, C.jobs[job].bullets[slot]);
}

// ---- Projects ------------------------------------------------------------
d.set(/^pnl-heatmap \(NPM Package\)/, C.projects[0]);
d.set(/^Dual-Hangman Game:/, C.projects[1]);

// ---- Skills sidebar ------------------------------------------------------
const oldSkills = [
  /^ ?Frontend: /, /^ ?Languages: /, /^ ?Backend: /, /^ ?UI & Styling: /,
  /^ ?Integration: /, /^ ?Databases: /, /^ ?Cloud & Server: /, /^ ?Tools: /,
  /^ ?Design Principles: /,
];
// The old lines are only slots; they take the canonical skill rows in order,
// so the skills block reads identically in v1, v3 and v4.
oldSkills.forEach((re, i) => {
  const [label, value] = C.skills[i];
  d.set(re, `**${label}:** ${value}`, { styles: S_SIDE, keepLeading: 2 });
});

// ---- Education -----------------------------------------------------------
const oldEdu = [/^ ?Master of Computer Application/, /^ ?Bachelor of Computer Application/, /^ ?Diploma In Civil Engineering/];
oldEdu.forEach((re, i) => {
  const e = C.education[i];
  d.set(re, `**${e.degree}** | ${e.school} | ${e.years} | ${e.score}`, { styles: S_EDU, keepLeading: 2 });
});

// ---- Contact -------------------------------------------------------------
d.set(/^Mobile- /, `Mobile- ${C.contact.phone}`, {
  styles: {
    base: `<w:rPr>${MAJOR}<w:color w:val="5E5E5E"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`,
    strong: `<w:rPr>${MAJOR}<w:color w:val="5E5E5E"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>`,
    link: S.link,
  },
});
const S_SOCIAL = {
  base: `<w:rPr>${MAJOR}<w:color w:val="3B3838" w:themeColor="background2" w:themeShade="40"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>`,
  strong: `<w:rPr>${MAJOR}<w:color w:val="3B3838" w:themeColor="background2" w:themeShade="40"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>`,
  link: `<w:rPr>${MAJOR}<w:color w:val="3B3838" w:themeColor="background2" w:themeShade="40"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>`,
};
d.set(/^linkedin\.com\/in\/amdpvz/, `[[${C.contact.linkedin}]]`, { styles: S_SOCIAL });
d.set(/^github\.com\/pvzamd/, `[[${C.contact.github}]]`, { styles: S_SOCIAL });

// ---- Headline under the name --------------------------------------------
// The template ships a name-only header, so nothing states the target role up
// top. Widen/deepen the name shape (both the DrawingML and the VML fallback)
// and add a white subtitle line inside it.
{
  const marker = 'descr="Name: Parvez Ahmed"';
  const at = doc.xml.indexOf(marker);
  if (at === -1) throw new Error('name shape not found');
  const start = doc.xml.lastIndexOf('<mc:AlternateContent>', at);
  const end = doc.xml.indexOf('</mc:AlternateContent>', at) + '</mc:AlternateContent>'.length;
  let scope = doc.xml.slice(start, end);

  const before = scope;
  scope = scope
    .split('cx="2055495" cy="462280"').join('cx="4064000" cy="609600"')
    .split('<wp:posOffset>-608965</wp:posOffset>').join('<wp:posOffset>-573405</wp:posOffset>')
    .split('width:161.85pt;height:36.4pt').join('width:320pt;height:48pt')
    .split('margin-top:-47.95pt').join('margin-top:-45.15pt');
  if (scope === before) throw new Error('name shape geometry not patched');

  const RPR = '<w:rFonts w:asciiTheme="majorHAnsi" w:hAnsiTheme="majorHAnsi" w:cstheme="majorHAnsi"/><w:noProof/><w:color w:val="FFFFFF"/><w:sz w:val="21"/><w:szCs w:val="21"/>';
  const subtitle =
    '<w:p><w:pPr><w:overflowPunct w:val="0"/><w:spacing w:before="20" w:after="0"/>' +
    `<w:rPr>${RPR}</w:rPr></w:pPr><w:r><w:rPr>${RPR}</w:rPr>` +
    `<w:t xml:space="preserve">${C.title.replace(/&/g, '&amp;')}</w:t></w:r></w:p>`;

  // append after the "Parvez Ahmed" paragraph in each txbxContent copy
  const { PARA_RE, plainText } = require('./docxedit');
  let added = 0;
  scope = scope.replace(PARA_RE, (p) => {
    if (plainText(p).trim() !== C.name) return p;
    added++;
    return p + subtitle;
  });
  if (added !== 2) throw new Error(`expected 2 name paragraphs, patched ${added}`);

  doc.xml = doc.xml.slice(0, start) + scope + doc.xml.slice(end);
  doc.log.push(`headline added x${added}`);
}

d.save(process.argv[2]);
console.log(d.log.join('\n'));
console.log('\nv1 edits applied: ' + d.log.length);
