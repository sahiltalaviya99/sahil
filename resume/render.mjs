/**
 * Entry point for the static PDF build — bundled by resume/build.mjs with
 * esbuild and executed in Node.
 *
 * It renders the *same* template component the /sahil9909657018 page renders, so
 * the PDF committed to public/ and the one Sahil prints from the builder are
 * produced by one implementation. Written without JSX so this file needs no
 * transform of its own; the templates it pulls in are .tsx and esbuild handles
 * those.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { defaultResume } from '@/content/resume';
import { accentById, templateById } from '@/components/resume/template-registry';

const template = templateById(process.env.RESUME_TEMPLATE || 'classic');
/* Black and white unless asked otherwise — the same default as the builder, and
   for the same reason: this is the copy that gets forwarded and printed on
   equipment nobody can see. `RESUME_ACCENT=emerald` (or any id in `accents`). */
const accent = accentById(process.env.RESUME_ACCENT || 'mono').value;

process.stdout.write(
  renderToStaticMarkup(createElement(template.Component, { doc: defaultResume, accent })),
);
