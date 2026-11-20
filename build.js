#!/usr/bin/env node
// Build all three resume versions from content.js.
//
//   node build.js            -> docx + pdf into dist/
//   node build.js --no-pdf   -> docx only (skips Word)
//   node build.js --job <dir> [--no-pdf]
//                            -> one-off resume for one job: v2 only, built from
//                               <dir>/content.js into <dir>. The generic resume and
//                               dist/ are not touched.
//
// Output name: <first>_<last>_<version>_<yyyy-mm-dd>.{docx,pdf}
// dist/ keeps only the latest set: older sets move to dist/archive/ once the new
// build has passed the parity check. Rebuilding on the same day overwrites that day's files.
// A job build is always <first>_<last>_resume.{docx,pdf}, so each job keeps one copy.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { zip } = require('./lib/pack');
const { checkParity } = require('./lib/parity');

const ROOT = __dirname;
const TPL = path.join(ROOT, 'templates');
const STAGE = path.join(ROOT, '.build');
const DIST = path.join(ROOT, 'dist');
const ARCHIVE = path.join(DIST, 'archive');
const VERSIONS = ['v1', 'v2', 'v3'];

const noPdf = process.argv.includes('--no-pdf');
const jobAt = process.argv.indexOf('--job');
const JOB = jobAt > -1 ? path.resolve(process.argv[jobAt + 1] || '') : null;
const CONTENT = JOB ? path.join(JOB, 'content.js') : path.join(ROOT, 'content.js');
if (JOB && !fs.existsSync(CONTENT)) {
  console.error(`--job needs a folder with a content.js: ${CONTENT} not found.`);
  process.exit(1);
}
const C = require(CONTENT);

const slug = C.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const now = new Date();
const stamp = [now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')].join('-');
const outBase = (v) => `${slug}_${v.replace('v', '')}_${stamp}`;

// Move earlier days' resumes from dist/ to dist/archive/, so dist/ only shows the
// latest set. Today's files stay, to be overwritten. Only files named like a build
// output are moved; anything else in dist/ is left alone.
function archiveOlder() {
  const ours = new RegExp(`^${slug}_\\d+_\\d{4}-\\d{2}-\\d{2}\\.(docx|pdf)$`, 'i');
  const older = fs.readdirSync(DIST, { withFileTypes: true })
    .filter((e) => e.isFile() && ours.test(e.name) && !e.name.includes(`_${stamp}.`))
    .map((e) => e.name);
  if (!older.length) return;
  fs.mkdirSync(ARCHIVE, { recursive: true });
  for (const name of older) {
    try {
      fs.renameSync(path.join(DIST, name), path.join(ARCHIVE, name));
    } catch (e) {
      console.error(`Could not move dist/${name} to dist/archive/ (${e.code}). ` +
        'Close it if it is open in Word or a PDF viewer, then build again.');
      process.exit(1);
    }
  }
  console.log(`moved ${older.length} older file(s) to dist/archive/`);
}

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });

const node = process.execPath;
const runner = (script, args) =>
  execFileSync(node, [path.join(ROOT, 'lib', script), ...args],
    { encoding: 'utf8', env: { ...process.env, RESUME_CONTENT: CONTENT } });

const built = [];
if (JOB) {
  // One job, one file: v2 is the ATS-safe version, and parity doesn't apply.
  const docx = path.join(JOB, `${slug}_resume.docx`);
  runner('v2.js', [path.join(STAGE, 'v2'), docx]);
  built.push(docx);
  console.log('  ' + path.relative(ROOT, docx));
} else {
  fs.mkdirSync(DIST, { recursive: true });

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

  // Only now, with a good build in hand, so a failed build never empties dist/.
  archiveOlder();
  for (const v of VERSIONS) {
    const docx = path.join(DIST, outBase(v) + '.docx');
    zip(path.join(STAGE, v), docx);
    built.push(docx);
    console.log('  ' + path.relative(ROOT, docx));
  }
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

// Copy the new PDFs into the personal site (its own repo, in personal-site/) under
// fixed names, so the site's résumé links never change. Only for the full build with
// PDFs; skipped if the site isn't here. Commit and push the site to publish them.
const SITE_RESUME = path.join(ROOT, 'personal-site', 'public', 'resume');
if (!JOB && !noPdf && fs.existsSync(path.dirname(SITE_RESUME))) {
  fs.mkdirSync(SITE_RESUME, { recursive: true });
  try {
    for (const v of VERSIONS) {
      fs.copyFileSync(path.join(DIST, outBase(v) + '.pdf'),
        path.join(SITE_RESUME, `${slug.replace(/_/g, '-')}-resume-${v.replace('v', '')}.pdf`));
    }
    console.log('copied the PDFs to personal-site/public/resume/ (commit and push the site to publish)');
  } catch (e) {
    console.error(`Could not copy the PDFs to the personal site (${e.code}). ` +
      'Close them if they are open, then build again.');
  }
}

fs.rmSync(STAGE, { recursive: true, force: true });
