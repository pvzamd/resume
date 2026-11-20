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

const doc = new Doc(process.argv[2], S, { links: C.links });
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
// A job with fewer bullets than slots loses its spare slots; removal runs before
// any set(), because remove() resets the record of already-written paragraphs.
for (const [re, job, slot] of oldBullets) {
  if (slot >= C.jobs[job].bullets.length) {
    const hits = d.remove(re);
    if (hits !== 2) throw new Error(`remove(): expected 2 matches, got ${hits} for: ${re}`);
  }
}
for (const [re, job, slot] of oldBullets) {
  if (slot < C.jobs[job].bullets.length) d.set(re, C.jobs[job].bullets[slot]);
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

// ---- Website row ----------------------------------------------------------
// The template has two link rows (LinkedIn, GitHub), each a small floating text
// box beside an icon. The website gets a copy of the GitHub box one row lower
// (no icon: the template has none for a website), a little wider so the longer
// address stays on one line, and the SKILLS sidebar box moves down by one row.
// Both the DrawingML shape and its VML fallback are patched, as for the headline.
if (C.contact.website) {
  const { PARA_RE, plainText } = require('./docxedit');
  const EMU_PT = 12700;
  const outerStart = (name) => {
    const at = doc.xml.indexOf(`name="${name}"`);
    if (at === -1) throw new Error(`shape not found: ${name}`);
    return doc.xml.lastIndexOf('<mc:AlternateContent>', at);
  };
  const posV = (from) => {
    const m = /<wp:positionV relativeFrom="paragraph">\s*<wp:posOffset>(-?\d+)<\/wp:posOffset>/.exec(doc.xml.slice(from));
    if (!m) throw new Error('positionV not found');
    return { at: from + m.index, text: m[0], value: +m[1] };
  };
  const replaceAt = (at, oldText, newText) => {
    if (doc.xml.slice(at, at + oldText.length) !== oldText) throw new Error('patch target moved');
    doc.xml = doc.xml.slice(0, at) + newText + doc.xml.slice(at + oldText.length);
  };
  // shift the VML fallback's margin-top in the <v:shape id="name"> tag
  const shiftVml = (xml, name, dPt) => {
    let n = 0;
    const out = xml.replace(new RegExp(`<v:shape [^>]*?\\bid="${name}"[^>]*>`), (tag) => tag.replace(/margin-top:(-?[\d.]+)pt/, (_, v) => {
      n++;
      return `margin-top:${+(+v + dPt).toFixed(2)}pt`;
    }));
    if (n !== 1) throw new Error(`VML margin-top not found for ${name}`);
    return out;
  };

  // one row = the gap between the LinkedIn and GitHub boxes
  const row = posV(outerStart('Text Box 165')).value - posV(outerStart('Text Box 163')).value;
  const rowPt = row / EMU_PT;
  if (row < 200000 || row > 330000) throw new Error(`unexpected row height: ${row} EMU`);

  // 1. move the sidebar (SKILLS and everything under it) down one row
  const side = posV(outerStart('Text Box 136'));
  replaceAt(side.at, side.text, side.text.replace(`>${side.value}<`, `>${side.value + row}<`));
  doc.xml = shiftVml(doc.xml, 'Text Box 136', rowPt);

  // 2. copy the run holding the GitHub box and insert it right after
  const acStart = outerStart('Text Box 165');
  const acEnd = doc.xml.indexOf('</mc:AlternateContent>', acStart) + '</mc:AlternateContent>'.length;
  const runStart = Math.max(doc.xml.lastIndexOf('<w:r>', acStart), doc.xml.lastIndexOf('<w:r ', acStart));
  const runEnd = doc.xml.indexOf('</w:r>', acEnd) + '</w:r>'.length;
  if (doc.xml.slice(runStart, acStart).includes('</w:r>') || /<w:r[ >]/.test(doc.xml.slice(acEnd, runEnd - 6))) {
    throw new Error('GitHub box is not alone in its run');
  }
  if ((doc.xml.slice(acStart, acEnd).match(/<mc:AlternateContent>/g) || []).length !== 1) throw new Error('nested shapes in GitHub box');

  const widen = 12; // pt
  const left = 18;  // pt: with no icon, the row starts where the icons do, inside the grey sidebar
  const maxDocPr = Math.max(...[...doc.xml.matchAll(/<wp:docPr id="(\d+)"/g)].map((m) => +m[1]));
  const maxSpid = Math.max(...[...doc.xml.matchAll(/_x0000_s(\d+)/g)].map((m) => +m[1]));
  let copy = doc.xml.slice(runStart, runEnd);
  const pv = /<wp:positionV relativeFrom="paragraph">\s*<wp:posOffset>(-?\d+)<\/wp:posOffset>/.exec(copy);
  if (!pv) throw new Error('website box: positionV not found');
  if (doc.xml.includes('5E1B5175') || doc.xml.includes('5E1B5176')) throw new Error('website box: ids already in use');
  const once = (s, from, to) => {
    if (!s.includes(from)) throw new Error(`website box: "${from}" not found`);
    return s.split(from).join(to);
  };
  copy = copy.replace(pv[0], pv[0].replace(`>${pv[1]}<`, `>${+pv[1] + row}<`));
  copy = shiftVml(copy, 'Text Box 165', rowPt);
  const ph = /<wp:positionH relativeFrom="column">\s*<wp:posOffset>(-?\d+)<\/wp:posOffset>/.exec(copy);
  if (!ph) throw new Error('website box: positionH not found');
  copy = copy.replace(ph[0], ph[0].replace(`>${ph[1]}<`, `>${+ph[1] - left * EMU_PT}<`));
  const movedLeft = copy.replace(/(<v:shape [^>]*?\bid="Text Box 165"[^>]*?margin-left:)(-?[\d.]+)pt/, (_, a, x) => `${a}${+(+x - left).toFixed(2)}pt`);
  if (movedLeft === copy) throw new Error('website box: VML margin-left not found');
  copy = movedLeft;
  const widened = copy.replace(/(<v:shape [^>]*?\bid="Text Box 165"[^>]*?[;"]width:)([\d.]+)pt/, (_, a, w) => `${a}${+(+w + widen).toFixed(2)}pt`);
  if (widened === copy) throw new Error('website box: VML width not found');
  copy = widened;
  copy = copy.replace(/<wp:extent cx="(\d+)"/, (_, cx) => `<wp:extent cx="${+cx + widen * EMU_PT}"`)
    .replace(/<a:ext cx="(\d+)"/, (_, cx) => `<a:ext cx="${+cx + widen * EMU_PT}"`);
  copy = copy.replace(/<wp:docPr id="\d+" name="Text Box 165"/, `<wp:docPr id="${maxDocPr + 1}" name="Website Box"`);
  copy = once(copy, 'id="Text Box 165"', 'id="Website Box"');
  copy = copy.replace(/o:spid="_x0000_s\d+"/, `o:spid="_x0000_s${maxSpid + 1}"`);
  copy = copy.replace(/anchorId="[0-9A-F]{8}"/g, 'anchorId="5E1B5175"');
  copy = copy.replace(/w14:paraId="[0-9A-F]{8}"/g, 'w14:paraId="5E1B5176"');
  // the copied text paragraphs become a placeholder without GitHub's hyperlink
  let swapped = 0;
  copy = copy.replace(PARA_RE, (p) => {
    if (!/^github\.com/.test(plainText(p).trim())) return p;
    swapped++;
    const open = p.match(/^<w:p(?:\s[^>]*)?>/)[0];
    const pPr = (p.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [''])[0];
    return `${open}${pPr}<w:r><w:t>__SITE__</w:t></w:r></w:p>`;
  });
  if (swapped !== 2) throw new Error(`website box: expected 2 text copies, got ${swapped}`);
  doc.xml = doc.xml.slice(0, runEnd) + copy + doc.xml.slice(runEnd);
  doc.edited.clear(); // paragraph ordinals shifted
  doc.log.push(`website row added ${rowPt.toFixed(2)}pt below GitHub; sidebar moved down`);

  d.set(/^__SITE__$/, `[[${C.contact.website}]]`, { styles: S_SOCIAL });
}

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

// ---- Experience: bullets beyond the template's slots -----------------------
// Cloned after the job's last filled slot, so they need no hyperlinks. Done last:
// cloneAfter() resets the written-paragraph record, which would let an earlier
// set() rule re-match text it had already written.
const plain = (m) => m.replace(/\*\*|\[\[|\]\]/g, '');
C.jobs.forEach((j, job) => {
  const slots = oldBullets.filter(([, jb]) => jb === job).length;
  for (let i = slots; i < j.bullets.length; i++) {
    const hits = d.cloneAfter(plain(j.bullets[i - 1]), j.bullets[i]);
    if (hits !== 2) throw new Error(`cloneAfter(): expected 2 matches, got ${hits} for bullet ${i}`);
  }
});

d.save(process.argv[2]);
console.log(d.log.join('\n'));
console.log('\nv1 edits applied: ' + d.log.length);
