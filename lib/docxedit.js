// Surgical docx paragraph rewriter.
// Rebuilds the run list of matched <w:p> blocks while keeping <w:pPr>,
// the paragraph's own run properties, and its hyperlink relationship ids.
const fs = require('fs');

const PARA_RE = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>|<w:p(?:\s[^>]*)?\/>/g;

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function plainText(block) {
  return (block.match(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g) || [])
    .map(t => t.replace(/<w:t(?: [^>]*)?>/, '').replace(/<\/w:t>/, ''))
    .join('')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function getPPr(block) {
  const m = block.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  return m ? m[0] : '';
}

// Collect the r:id of each <w:hyperlink> in document order.
function getLinkIds(block) {
  return (block.match(/<w:hyperlink[^>]*r:id="([^"]+)"[^>]*>/g) || [])
    .map(h => h.match(/r:id="([^"]+)"/)[1]);
}

// Split a paragraph body into top-level children (hyperlinks matched before runs,
// since a hyperlink wraps runs; w:r never nests inside w:r).
const CHILD_RE = /<w:hyperlink(?:\s[^>]*)?>[\s\S]*?<\/w:hyperlink>|<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>|<w:r(?:\s[^>]*)?\/>|<w:[a-zA-Z]+(?:\s[^>]*)?\/>/g;

function splitChildren(body) {
  return body.match(CHILD_RE) || [];
}

// "\n" in markup becomes a soft line break (<w:br/>) inside the run.
function makeRun(rPr, text) {
  let inner = '';
  text.split('\n').forEach((part, i) => {
    if (i) inner += '<w:br/>';
    if (!part) return;
    const sp = /^\s|\s$/.test(part) ? ' xml:space="preserve"' : '';
    inner += `<w:t${sp}>${esc(part)}</w:t>`;
  });
  return `<w:r>${rPr}${inner}</w:r>`;
}

// Parse markup into tokens: **bold**, [[link]], plain
function tokenize(markup) {
  const tokens = [];
  const re = /\*\*([\s\S]*?)\*\*|\[\[([\s\S]*?)\]\]/g;
  let last = 0, m;
  while ((m = re.exec(markup))) {
    if (m.index > last) tokens.push({ kind: 'plain', text: markup.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ kind: 'strong', text: m[1] });
    else tokens.push({ kind: 'link', text: m[2] });
    last = m.index + m[0].length;
  }
  if (last < markup.length) tokens.push({ kind: 'plain', text: markup.slice(last) });
  return tokens;
}

class Doc {
  constructor(path, styles) {
    this.path = path;
    this.xml = fs.readFileSync(path, 'utf8');
    this.styles = styles; // { base, strong, link }
    this.log = [];
    // Ordinals of paragraphs already rewritten. A rule must never match text a
    // previous rule just wrote (e.g. writing "Integration: ..." into the old
    // "UI & Styling" slot would otherwise be re-matched by the Integration rule).
    this.edited = new Set();
  }

  _eachPara(pred, fn, { skipEdited = false } = {}) {
    let hits = 0;
    let i = -1;
    this.xml = this.xml.replace(PARA_RE, (block) => {
      i++;
      if (skipEdited && this.edited.has(i)) return block;
      if (!pred(plainText(block), block)) return block;
      hits++;
      if (skipEdited) this.edited.add(i);
      return fn(block);
    });
    return hits;
  }

  // Replace the runs of every paragraph whose plain text matches `match`
  // (string => exact trimmed equality, RegExp => test).
  set(match, markup, opts = {}) {
    const pred = (txt) => (match instanceof RegExp ? match.test(txt) : txt.trim() === match.trim());
    const st = Object.assign({}, this.styles, opts.styles || {});
    const keepLeading = opts.keepLeading || 0;
    const hits = this._eachPara(pred, (block) => {
      const pPr = getPPr(block);
      const open = block.match(/^<w:p(?:\s[^>]*)?>/)[0];
      const body = block.slice(open.length, block.length - '</w:p>'.length).replace(pPr, '');
      // Decorative runs to keep verbatim (e.g. inline bullet images).
      const kept = keepLeading ? splitChildren(body).slice(0, keepLeading).join('') : '';
      const linkIds = getLinkIds(block);
      let li = 0;
      let runs = '';
      for (const t of tokenize(markup)) {
        if (!t.text) continue;
        if (t.kind === 'link') {
          const id = linkIds[li++];
          if (!id) throw new Error(`No hyperlink #${li} available in paragraph: ${plainText(block).slice(0, 60)}`);
          runs += `<w:hyperlink r:id="${id}" w:history="1">${makeRun(st.link, t.text)}</w:hyperlink>`;
        } else if (t.kind === 'strong') {
          runs += makeRun(st.strong, t.text);
        } else {
          runs += makeRun(st.base, t.text);
        }
      }
      return `${open}${pPr}${kept}${runs}</w:p>`;
    }, { skipEdited: true });
    if (!hits) throw new Error(`set(): no paragraph matched: ${match}`);
    if (opts.expect && hits !== opts.expect) {
      throw new Error(`set(): expected ${opts.expect} matches, got ${hits} for: ${match}`);
    }
    this.log.push(`set x${hits}: ${String(match).slice(0, 55)}`);
    return hits;
  }

  remove(match) {
    const pred = (txt) => (match instanceof RegExp ? match.test(txt) : txt.trim() === match.trim());
    const hits = this._eachPara(pred, () => '');
    this.edited.clear(); // paragraph ordinals shifted
    if (!hits) throw new Error(`remove(): no paragraph matched: ${match}`);
    this.log.push(`remove x${hits}: ${String(match).slice(0, 55)}`);
    return hits;
  }

  // Duplicate the paragraph matching `anchor` and place the copy right after it,
  // filling the copy with `markup`. The clone drops hyperlinks (no new rels needed).
  cloneAfter(anchor, markup, opts = {}) {
    const pred = (txt) => (anchor instanceof RegExp ? anchor.test(txt) : txt.trim() === anchor.trim());
    const st = Object.assign({}, this.styles, opts.styles || {});
    const hits = this._eachPara(pred, (block) => {
      const pPr = opts.pPr !== undefined ? opts.pPr : getPPr(block);
      let runs = '';
      for (const t of tokenize(markup)) {
        if (!t.text) continue;
        runs += makeRun(t.kind === 'strong' ? st.strong : st.base, t.text);
      }
      return `${block}<w:p>${pPr}${runs}</w:p>`;
    });
    this.edited.clear(); // paragraph ordinals shifted
    if (!hits) throw new Error(`cloneAfter(): no paragraph matched: ${anchor}`);
    this.log.push(`cloneAfter x${hits}: ${String(anchor).slice(0, 45)}`);
    return hits;
  }

  raw(find, replace) {
    if (!this.xml.includes(find)) throw new Error(`raw(): not found: ${find.slice(0, 60)}`);
    const n = this.xml.split(find).length - 1;
    this.xml = this.xml.split(find).join(replace);
    this.log.push(`raw x${n}: ${find.slice(0, 45)}`);
    return n;
  }

  save(outPath) {
    fs.writeFileSync(outPath || this.path, this.xml, 'utf8');
  }
}

module.exports = { Doc, plainText, PARA_RE };
