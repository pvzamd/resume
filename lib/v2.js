// v4 — redesigned from scratch: single column, no tables, text boxes, images or
// multi-column sections, so applicant-tracking systems read it top-to-bottom in
// the intended order. Same copy as v1 and v3.
const fs = require('fs');
const path = require('path');
const C = require('../content');
const { zip } = require('./pack');

// ---- design tokens -------------------------------------------------------
const T = {
  ink: '1A1A1A',        // body text
  muted: '4A4A4A',      // secondary text
  accent: '1F3A5F',     // name, section rules, links — deep slate blue
  rule: 'C7CEDA',       // hairline under section headings
  font: 'Calibri',      // metric-safe and present on every Windows/Word install

  szName: 42,           // half-points -> 21pt
  szTitle: 22,          // 11pt
  szContact: 19,        // 9.5pt
  szHeading: 20,        // 10pt
  // 9.5pt body is what lets the full content sit on one A4 page; the spare
  // vertical space is spent on section spacing rather than a larger face.
  szBody: 19,           // 9.5pt
  szMeta: 19,

  pageW: 11906, pageH: 16838,          // A4, twips
  margin: 680, marginTB: 560,
};
const COL_W = T.pageW - 2 * T.margin;  // usable column width in twips

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- relationship bookkeeping -------------------------------------------
const rels = [];
function relFor(url) {
  let r = rels.find((x) => x.url === url);
  if (!r) {
    r = { id: 'rId' + (100 + rels.length), url };
    rels.push(r);
  }
  return r.id;
}

// ---- run helpers ---------------------------------------------------------
function rPr({ b, i, size, color, caps, spacing, u, font }) {
  let s = `<w:rFonts w:ascii="${font || T.font}" w:hAnsi="${font || T.font}" w:cs="${font || T.font}"/>`;
  if (b) s += '<w:b/><w:bCs/>';
  if (i) s += '<w:i/><w:iCs/>';
  if (caps) s += '<w:caps/>';
  if (spacing) s += `<w:spacing w:val="${spacing}"/>`;
  if (color) s += `<w:color w:val="${color}"/>`;
  s += `<w:sz w:val="${size || T.szBody}"/><w:szCs w:val="${size || T.szBody}"/>`;
  if (u) s += '<w:u w:val="single"/>';
  return `<w:rPr>${s}</w:rPr>`;
}

function run(text, style = {}) {
  const p = rPr(style);
  let inner = '';
  String(text).split('\n').forEach((part, idx) => {
    if (idx) inner += '<w:br/>';
    if (!part) return;
    const sp = /^\s|\s$/.test(part) ? ' xml:space="preserve"' : '';
    inner += `<w:t${sp}>${esc(part)}</w:t>`;
  });
  return `<w:r>${p}${inner}</w:r>`;
}

function tab() { return '<w:r><w:tab/></w:r>'; }

// Accent colour is applied last so a link stays visibly a link even when the
// surrounding run style sets its own colour.
function link(text, style = {}) {
  const url = C.links[text];
  if (!url) throw new Error('no url for link text: ' + text);
  return `<w:hyperlink r:id="${relFor(url)}" w:history="1">` +
    run(text, Object.assign({}, style, { color: T.accent, u: true })) + '</w:hyperlink>';
}

// Render markup (**strong**, [[link]]) into runs.
function rich(markup, base = {}) {
  let out = '';
  const re = /\*\*([\s\S]*?)\*\*|\[\[([\s\S]*?)\]\]/g;
  let last = 0, m;
  while ((m = re.exec(markup))) {
    if (m.index > last) out += run(markup.slice(last, m.index), base);
    if (m[1] !== undefined) out += run(m[1], Object.assign({}, base, { b: true, color: T.ink }));
    else out += link(m[2], base);
    last = m.index + m[0].length;
  }
  if (last < markup.length) out += run(markup.slice(last), base);
  return out;
}

// ---- paragraph helpers ---------------------------------------------------
function para(runs, opts = {}) {
  let pPr = '<w:pPr>';
  if (opts.style) pPr += `<w:pStyle w:val="${opts.style}"/>`;
  if (opts.tabRight) pPr += `<w:tabs><w:tab w:val="right" w:pos="${COL_W}"/></w:tabs>`;
  if (opts.bullet) {
    pPr += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>';
    pPr += `<w:ind w:left="${opts.indent || 227}" w:hanging="${opts.hanging || 227}"/>`;
  } else if (opts.indent) {
    pPr += `<w:ind w:left="${opts.indent}"/>`;
  }
  pPr += `<w:spacing w:before="${opts.before || 0}" w:after="${opts.after == null ? 0 : opts.after}"` +
    `${opts.line ? ` w:line="${opts.line}" w:lineRule="auto"` : ' w:line="240" w:lineRule="auto"'}/>`;
  if (opts.jc) pPr += `<w:jc w:val="${opts.jc}"/>`;
  if (opts.border) {
    pPr += `<w:pBdr><w:bottom w:val="single" w:sz="${opts.border}" w:space="2" w:color="${opts.borderColor || T.rule}"/></w:pBdr>`;
  }
  if (opts.keepNext) pPr += '<w:keepNext/>';
  pPr += '</w:pPr>';
  return `<w:p>${pPr}${runs}</w:p>`;
}

// Section headings carry no character spacing: at 1.5pt tracking PDF text
// extraction returns "S U M M A R Y" instead of "SUMMARY", which can stop an
// ATS recognising the section. Bold + caps + accent + rule give the hierarchy.
function section(title) {
  return para(run(title, { b: true, size: T.szHeading, color: T.accent, caps: true }),
    { before: 180, after: 70, border: 6, keepNext: true });
}

// ---- document body -------------------------------------------------------
const body = [];

// Header: name, title, one contact line
body.push(para(run(C.name, { b: true, size: T.szName, color: T.accent, spacing: 10 }), { after: 30 }));
body.push(para(run(C.title, { size: T.szTitle, color: T.muted, spacing: 14 }), { after: 60 }));

const SEP = { size: T.szContact, color: T.rule, spacing: 30 };
const CT = { size: T.szContact, color: T.muted };
body.push(para(
  run(C.contact.location, CT) + run(' | ', SEP) +
  run(C.contact.phone, CT) + run(' | ', SEP) +
  link(C.contact.email, { size: T.szContact }) + run(' | ', SEP) +
  link(C.contact.linkedin, { size: T.szContact }) + run(' | ', SEP) +
  link(C.contact.github, { size: T.szContact }),
  { after: 40, border: 12, borderColor: T.accent }
));

// Summary
body.push(section('Summary'));
body.push(para(rich(C.profile, { color: T.muted }), { after: 60 }));

// Experience
body.push(section('Experience'));
for (const j of C.jobs) {
  body.push(para(
    rich(`[[${j.company}]]${j.suffix}`, { b: true, size: T.szBody, color: T.ink }) +
    tab() + run(j.dates, { size: T.szMeta, color: T.muted }),
    { tabRight: true, before: 100, after: 0, keepNext: true }
  ));
  body.push(para(run(j.role, { i: true, size: T.szMeta, color: T.accent }),
    { after: 50, keepNext: true }));
  for (const b of j.bullets) {
    body.push(para(rich(b, { color: T.muted }), { bullet: true, after: 30 }));
  }
}

// Projects
body.push(section('Projects'));
for (const p of C.projects) {
  body.push(para(rich(p, { color: T.muted }), { bullet: true, after: 45 }));
}

// Skills
body.push(section('Skills'));
for (const [label, value] of C.skills) {
  body.push(para(
    run(label + ': ', { b: true, color: T.ink }) + run(value, { color: T.muted }),
    { after: 20, indent: 0 }
  ));
}

// Education
body.push(section('Education'));
for (const e of C.education) {
  body.push(para(
    run(e.degree, { b: true, color: T.ink }) + run(' | ', { color: T.rule, spacing: 30 }) +
    run(e.school, { color: T.muted }) +
    tab() + run(`${e.years} | ${e.score}`, { size: T.szMeta, color: T.muted }),
    { tabRight: true, after: 30 }
  ));
}

const sectPr =
  `<w:sectPr><w:pgSz w:w="${T.pageW}" w:h="${T.pageH}"/>` +
  `<w:pgMar w:top="${T.marginTB}" w:right="${T.margin}" w:bottom="${T.marginTB}" w:left="${T.margin}"` +
  ' w:header="0" w:footer="0" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>';

const documentXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
  '<w:body>' + body.join('') + sectPr + '</w:body></w:document>';

// ---- supporting parts ----------------------------------------------------
const stylesXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr>' +
  `<w:rFonts w:ascii="${T.font}" w:hAnsi="${T.font}" w:cs="${T.font}"/>` +
  `<w:color w:val="${T.ink}"/><w:sz w:val="${T.szBody}"/><w:szCs w:val="${T.szBody}"/>` +
  '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr>' +
  '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
  '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/>' +
  `<w:rPr><w:color w:val="${T.accent}"/></w:rPr></w:style>` +
  '</w:styles>';

const numberingXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>' +
  '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>' +
  '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="227" w:hanging="227"/></w:pPr>' +
  `<w:rPr><w:rFonts w:ascii="${T.font}" w:hAnsi="${T.font}" w:hint="default"/>` +
  `<w:color w:val="${T.accent}"/></w:rPr></w:lvl></w:abstractNum>` +
  '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

const settingsXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:compat><w:compatSetting w:name="compatibilityMode" ' +
  'w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>';

const contentTypes =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
  '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' +
  '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
  '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
  '</Types>';

const rootRels =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
  '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
  '</Relationships>';

const docRels =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
  '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
  rels.map((r) => `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(r.url)}" TargetMode="External"/>`).join('') +
  '</Relationships>';

const coreXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
  'xmlns:dc="http://purl.org/dc/elements/1.1/">' +
  `<dc:title>${esc(C.name)} - ${esc(C.title)}</dc:title>` +
  `<dc:creator>${esc(C.name)}</dc:creator>` +
  `<cp:keywords>Vue.js, React, Next.js, Node.js, TypeScript, Frontend Engineer</cp:keywords>` +
  '</cp:coreProperties>';

const appXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">' +
  '<Application>Microsoft Office Word</Application></Properties>';

// ---- write package -------------------------------------------------------
const out = process.argv[2];
const files = {
  '[Content_Types].xml': contentTypes,
  '_rels/.rels': rootRels,
  'word/document.xml': documentXml,
  'word/_rels/document.xml.rels': docRels,
  'word/styles.xml': stylesXml,
  'word/numbering.xml': numberingXml,
  'word/settings.xml': settingsXml,
  'docProps/core.xml': coreXml,
  'docProps/app.xml': appXml,
};
fs.rmSync(out, { recursive: true, force: true });
for (const [rel, data] of Object.entries(files)) {
  const full = path.join(out, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, data, 'utf8');
}
zip(out, process.argv[3]);
console.log(`v4 built: ${body.length} paragraphs, ${rels.length} hyperlinks -> ${process.argv[3]}`);
