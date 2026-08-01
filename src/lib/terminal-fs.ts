import { experience } from '@/content/experience';
import { projects } from '@/content/projects';
import { skillGroups, coreStack, levelValue } from '@/content/skills';
import { site, socials } from '@/content/site';

/**
 * A virtual filesystem generated from the real content modules.
 *
 * Nothing here is hand-written duplicate copy — add a project to
 * content/projects.ts and it appears under ~/projects automatically. That
 * matters: a fake terminal whose contents drift from the rest of the site is
 * worse than no terminal.
 */

export type FsFile = { type: 'file'; name: string; lines: string[] };
export type FsDir = { type: 'dir'; name: string; children: Record<string, FsNode> };
export type FsNode = FsFile | FsDir;

const file = (name: string, lines: string[]): FsFile => ({ type: 'file', name, lines });

const dir = (name: string, children: FsNode[]): FsDir => ({
  type: 'dir',
  name,
  children: Object.fromEntries(children.map((c) => [c.name, c])),
});

/** kebab-case a title into a filename stem. */
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const wrap = (text: string, width = 76): string[] => {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      out.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out;
};

const projectFile = (p: (typeof projects)[number]) =>
  file(`${slug(p.title)}.md`, [
    `# ${p.title}`,
    ...(p.client ? [`client:  ${p.client}`] : []),
    `year:    ${p.year}`,
    `status:  ${p.status}`,
    `role:    ${p.role}`,
    '',
    ...wrap(p.detail),
    '',
    `outcome: ${p.outcome}`,
    `stack:   ${p.tags.join(', ')}`,
    ...(p.demo ? ['', `live:    ${p.demo}`] : []),
  ]);

const experienceFile = (e: (typeof experience)[number]) =>
  file(`${e.id}.txt`, [
    `${e.title}`,
    `${e.org}  ·  ${e.period}${e.current ? '  ·  [current]' : ''}`,
    '',
    ...wrap(e.summary),
    '',
    ...e.points.map((p) => `  - ${p}`),
    '',
    `skills: ${e.skills.join(', ')}`,
  ]);

const skillFile = (g: (typeof skillGroups)[number]) =>
  file(`${g.id}.txt`, [
    `${g.label}`,
    ...wrap(g.blurb),
    '',
    ...g.skills.map((s) => `  ${s.name.padEnd(30, ' ')} ${s.level}`),
  ]);

export const root: FsDir = dir('~', [
  file('about.txt', [
    `${site.name}`,
    `${site.role}`,
    `${site.location}  ·  @ ${site.company}`,
    '',
    ...wrap(site.tagline),
    '',
    site.available ? 'status: open to opportunities' : 'status: currently engaged',
  ]),

  file('contact.txt', [
    'Get in touch',
    '',
    ...socials.map((s) => `  ${s.name.padEnd(10, ' ')} ${s.href.replace('mailto:', '')}`),
    '',
    "Try 'email' to copy the address, or 'resume' to download the PDF.",
  ]),

  dir(
    'projects',
    projects.map(projectFile),
  ),

  dir(
    'experience',
    experience.map(experienceFile),
  ),

  dir('skills', [
    file('core.txt', [
      'Core stack',
      '',
      ...coreStack.map(
        (s) => `  ${s.name.padEnd(28, ' ')} ${String(levelValue[s.level]).padStart(3)}%  ${s.level}`,
      ),
    ]),
    ...skillGroups.map(skillFile),
  ]),
]);

/** Resolve a path string against a current directory. Supports . .. / and ~ */
export const resolvePath = (
  cwd: string[],
  input: string,
): { node: FsNode; path: string[] } | null => {
  const raw = input.trim();
  const startAtRoot = raw.startsWith('/') || raw.startsWith('~');
  const segments = raw
    .replace(/^~\/?/, '')
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean);

  const path = startAtRoot ? [] : [...cwd];

  for (const seg of segments) {
    if (seg === '.') continue;
    if (seg === '..') {
      path.pop();
      continue;
    }
    path.push(seg);
  }

  // Walk from root down the resolved path.
  let node: FsNode = root;
  for (const seg of path) {
    if (node.type !== 'dir' || !node.children[seg]) return null;
    node = node.children[seg];
  }

  return { node, path };
};

export const nodeAt = (path: string[]): FsNode => {
  let node: FsNode = root;
  for (const seg of path) {
    if (node.type === 'dir' && node.children[seg]) node = node.children[seg];
  }
  return node;
};

export const promptPath = (path: string[]) => (path.length ? `~/${path.join('/')}` : '~');
