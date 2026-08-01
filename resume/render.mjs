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
import { templateById } from '@/components/resume/template-registry';

const template = templateById(process.env.RESUME_TEMPLATE || 'classic');
process.stdout.write(renderToStaticMarkup(createElement(template.Component, { doc: defaultResume })));
