/**
 * Renders the résumé to public/Sahil Talaviya Resume.pdf — the file site.resume
 * links to.
 *
 *     node resume/build.mjs                    # Classic
 *     RESUME_TEMPLATE=compact node resume/build.mjs
 *
 * There is no separate HTML source. The markup comes from the same template
 * components the builder page at /sahil9909657018 renders, via
 * `react-dom/server`, and the styling is the same resume.css — so this file and
 * anything Sahil prints from the browser are the same document by construction.
 * A hand-maintained duplicate is how a résumé ends up disagreeing with the site
 * that links to it.
 *
 * Chrome does the printing, so no PDF dependency is added: the same headless
 * binary already used to verify the site.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = join(root, 'public', 'Sahil Talaviya Resume.pdf');
const BACKUP = join(here, 'previous-resume.pdf');

const work = mkdtempSync(join(tmpdir(), 'resume-'));
const cleanup = () => rmSync(work, { recursive: true, force: true });

try {
  /* -------------------------------------------------------------------- */
  /*  1. Bundle and run the renderer                                       */
  /* -------------------------------------------------------------------- */

  const bundle = join(work, 'render.cjs');

  /* esbuild's JS API rather than the CLI. The repo path contains a space
     ("my portfolie"), and shelling out on Windows re-splits the argv on it —
     esbuild then sees two input files and refuses to write a single outfile.

     Output is CJS, not ESM: react-dom/server is CommonJS and calls
     `require('stream')` at load time, which esbuild's ESM shim turns into
     "Dynamic require of \"stream\" is not supported". As CJS the require is
     native and it just works. */
  const esbuild = await import('esbuild');
  await esbuild.build({
    entryPoints: [join(here, 'render.mjs')],
    outfile: bundle,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    alias: { '@': join(root, 'src') },
    resolveExtensions: ['.tsx', '.ts', '.mjs', '.js', '.jsx'],
    logLevel: 'warning',
  });

  const body = execFileSync(process.execPath, [bundle], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env },
  });

  /* -------------------------------------------------------------------- */
  /*  2. Assemble a self-contained page                                    */
  /* -------------------------------------------------------------------- */

  /* Fonts are inlined as base64 rather than linked. A file:// page cannot
     reliably load subresources in headless Chrome, and a résumé that silently
     falls back to Times on someone else's machine is worse than one that never
     used Inter at all. */
  const face = (family, relPath) => `
    @font-face {
      font-family: '${family}';
      src: url('data:font/woff2;base64,${readFileSync(join(root, relPath)).toString('base64')}') format('woff2-variations');
      font-weight: 100 900;
      font-display: block;
    }`;

  const css = readFileSync(join(root, 'src/components/resume/resume.css'), 'utf8');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sahil Talaviya — Resume</title>
<style>
${face('Inter Variable', 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}
${face('Space Grotesk Variable', 'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2')}
${css}
/* The page IS the sheet here — there is no app to hide, so the print rule that
   reveals the portal has nothing to act on. Show it unconditionally. */
html, body { margin: 0; background: #fff; }
@page { size: A4; margin: 0; }
.resume-sheet { min-height: 0; }
</style></head>
<body>${body}</body></html>`;

  const page = join(work, 'resume.html');
  writeFileSync(page, html);

  /* -------------------------------------------------------------------- */
  /*  3. Print                                                             */
  /* -------------------------------------------------------------------- */

  // This overwrites the file the live site links to — keep the outgoing one.
  if (existsSync(OUT) && !existsSync(BACKUP)) {
    copyFileSync(OUT, BACKUP);
    console.log(`backed up previous resume -> ${BACKUP}`);
  }

  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      `--user-data-dir=${join(work, 'prof')}`,
      // Chrome otherwise stamps the source URL and today's date on every page.
      '--no-pdf-header-footer',
      `--print-to-pdf=${OUT}`,
      // Fonts are embedded, but give them a moment to apply before the snapshot.
      '--virtual-time-budget=6000',
      `file:///${page.replace(/\\/g, '/')}`,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );

  const pdf = readFileSync(OUT).toString('latin1');
  const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const toUnicode = (pdf.match(/ToUnicode/g) || []).length;

  console.log(
    `wrote ${OUT}\n  template ${process.env.RESUME_TEMPLATE || 'classic'} · ${pages} page(s) · ` +
      `${(pdf.length / 1024).toFixed(1)} kB · ${toUnicode} ToUnicode maps`,
  );

  /* Without ToUnicode maps an embedded subset font extracts as glyph indices,
     so the text looks perfect and every applicant-tracking system reads
     gibberish. Worth failing the build over. */
  if (toUnicode === 0) {
    console.error('WARNING: no ToUnicode maps — text will not extract. Do not send this file.');
    process.exitCode = 1;
  }
} finally {
  cleanup();
}
