#!/usr/bin/env node
// Build all three resume versions from content.js.
//
//   node build.js            -> docx + pdf into dist/
//   node build.js --no-pdf   -> docx only (skips Word)
//
// Output name: <first>_<last>_<version>_<yyyy-mm-dd>.{docx,pdf}
// Rebuilding on the same day overwrites that day's files.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { zip } = require('./lib/pack');
const { checkParity } = require('./lib/parity');
const C = require('./content');

const ROOT = __dirname;
const TPL = path.join(ROOT, 'templates');
const STAGE = path.join(ROOT, '.build');
const DIST = path.join(ROOT, 'dist');
const VERSIONS = ['v1', 'v2', 'v3'];

const noPdf = process.argv.includes('--no-pdf');

const slug = C.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const now = new Date();
const stamp = [now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')].join('-');
const outBase = (v) => `${slug}_${v.replace('v', '')}_${stamp}`;

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

const node = process.execPath;
const runner = (script, args) =>
  execFileSync(node, [path.join(ROOT, 'lib', script), ...args], { encoding: 'utf8' });

// v1 and v3 are content edits applied to a pristine copy of the original
// template, so their designs stay byte-identical apart from the words.
for (const v of ['v1', 'v3']) {
  const work = path.join(STAGE, v);
  fs.cpSync(path.join(TPL, v), work, { recursive: true });
  runner(`${v}.js`, [path.join(work, 'word', 'document.xml')]);
}
// v2 is generated from scratch.
runner('v2.js', [path.join(STAGE, 'v2'), path.join(STAGE, 'v2.docx')]);

// Fail the build if the three versions have drifted apart.
const { problems, count } = checkParity(
  Object.fromEntries(VERSIONS.map((v) => [v, path.join(STAGE, v)])));
if (problems.length) {
  console.error('\nContent parity FAILED:\n' + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log(`parity ok — ${count} content items identical across v1, v2, v3`);

const built = [];
for (const v of VERSIONS) {
  const docx = path.join(DIST, outBase(v) + '.docx');
  zip(path.join(STAGE, v), docx);
  built.push(docx);
  console.log('  ' + path.relative(ROOT, docx));
}

if (!noPdf) {
  try {
    const out = execFileSync('powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
        path.join(ROOT, 'lib', 'topdf.ps1'), '-Files', built.join(';')],
      { encoding: 'utf8' });
    process.stdout.write(out);
  } catch (e) {
    console.error('PDF step failed (Word not available?). DOCX files are still built.');
    console.error(String(e.stdout || e.message).trim());
    process.exit(1);
  }
}

fs.rmSync(STAGE, { recursive: true, force: true });
