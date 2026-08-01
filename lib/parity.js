// Two-way content parity check across the three layouts.
//   1. every content item from content.js appears in all three documents
//   2. no document contains substantive text that isn't in content.js (catches
//      a stale sentence left behind in one version)
// Soft line breaks and tab stops are normalised so the differing layouts compare
// fairly: v3 splits education over soft breaks, v2 right-aligns dates on a tab.
const fs = require('fs');
const path = require('path');
const { PARA_RE } = require('./docxedit');
const C = require('../content');

const norm = (s) => s.replace(/’/g, "'").replace(/\s+/g, ' ').trim();

function paraText(block) {
  const marked = block
    .replace(/<w:br\s*\/>/g, '<SEP/>')
    .replace(/<w:tab\s*\/>/g, '<GAP/>');
  const bits = marked.match(/<w:t(?: [^>]*)?>[\s\S]*?<\/w:t>|<SEP\/>|<GAP\/>/g) || [];
  const text = bits.map((t) => {
    if (t === '<SEP/>') return ' | ';
    if (t === '<GAP/>') return ' ';
    return t.replace(/<w:t(?: [^>]*)?>/, '').replace(/<\/w:t>/, '');
  }).join('');
  return norm(text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
}

function paras(dir) {
  const xml = fs.readFileSync(path.join(dir, 'word', 'document.xml'), 'utf8');
  return [...new Set((xml.match(PARA_RE) || []).map(paraText).filter(Boolean))];
}

const strip = (s) => norm(String(s).replace(/\*\*/g, '').replace(/\[\[|\]\]/g, ''));

function buildCanon() {
  const canon = new Set();
  const add = (s) => canon.add(strip(s));
  add(C.name); add(C.title); add(C.profile);
  Object.values(C.contact).forEach(add);
  add([C.contact.location, C.contact.phone, C.contact.email,
    C.contact.linkedin, C.contact.github].join(' | '));
  [`Mobile- ${C.contact.phone}`, `Mobile: ${C.contact.phone}`,
    `Email- ${C.contact.email}`, `Email: ${C.contact.email}`,
    `Address- ${C.contact.location}`, `Address: ${C.contact.location}`].forEach(add);
  for (const j of C.jobs) {
    add(j.role); add(j.company); add(j.dates);
    add(`${j.company}${j.suffix} | ${j.dates}`);                // v1
    add(`${j.company}${j.suffix} | ${j.role} | ${j.dates}`);    // v3
    add(`${j.company}${j.suffix} ${j.dates}`);                  // v2, tab between
    j.bullets.forEach(add);
  }
  C.projects.forEach(add);
  C.skills.forEach(([l, v]) => add(`${l}: ${v}`));
  C.education.forEach((e) => {
    add(`${e.degree} | ${e.school} | ${e.years} | ${e.score}`); // v1
    add(`${e.degree} | ${e.school} ${e.years} | ${e.score}`);   // v2, tab between
  });
  return canon;
}

// Section headings and template furniture that legitimately differ per layout.
const HEADINGS = new Set(['Profile', 'Experience', 'SKILLS', 'Skills', 'EDUCATION',
  'Education', 'Contact', 'Summary', 'SUMMARY', 'EXPERIENCE', 'PROJECTS', 'Projects',
  'Open Source/Personal projects', 'Open Source / Personal Projects'].map(norm));

function checkParity(dirs) {
  const canon = buildCanon();
  const docs = Object.fromEntries(Object.entries(dirs).map(([k, d]) => [k, paras(d)]));
  const problems = [];

  for (const [name, list] of Object.entries(docs)) {
    for (const p of list) {
      if (p.length < 3 || HEADINGS.has(p) || canon.has(p)) continue;
      if (C.education.some((e) => p.includes(strip(e.degree)) && p.includes(strip(e.school)))) continue;
      problems.push(`UNEXPECTED in ${name}: "${p.slice(0, 100)}"`);
    }
  }

  const mustHave = [C.profile, C.title,
    ...C.jobs.flatMap((j) => [...j.bullets, j.company, j.role, j.dates]),
    ...C.projects,
    ...C.skills.map(([l, v]) => `${l}: ${v}`),
    ...C.education.flatMap((e) => [e.degree, e.school, e.years, e.score]),
    ...Object.values(C.contact)].map(strip);

  for (const item of mustHave) {
    const missing = Object.entries(docs)
      .filter(([, list]) => !list.some((p) => p.includes(item))).map(([k]) => k);
    if (missing.length) problems.push(`MISSING from ${missing.join(', ')}: "${item.slice(0, 90)}"`);
  }

  return { problems, count: mustHave.length };
}

module.exports = { checkParity };
