/**
 * The old data carried a `level` on all 31 skills and a `levelMap` to turn it
 * into a percentage — neither was ever rendered. Both are used here.
 *
 * Icons are deliberately gone: the previous version hotlinked 31 logos from
 * devicon / flaticon / wikipedia with no error fallback, so the section broke
 * offline and the multicolour brand marks fought the palette. Type does the
 * job better and costs nothing.
 *
 * GROUP ORDER IS DELIBERATE. AI/automation and backend lead, frontend sits
 * third. Leading with "Frontend" reads as "frontend developer who also does
 * some other things", which is the exact impression this site should not give.
 */

export type Level = 'Expert' | 'Advanced' | 'Intermediate';

export const levelValue: Record<Level, number> = {
  Expert: 92,
  Advanced: 78,
  Intermediate: 62,
};

export type Skill = { name: string; level: Level };

/**
 * Headline stack — rendered with proficiency bars. Keep this to six, and keep
 * it spread across the vertical rather than stacked on one layer.
 */
export const coreStack: Skill[] = [
  { name: 'Node.js & API design', level: 'Advanced' },
  { name: 'PostgreSQL & schema design', level: 'Advanced' },
  { name: 'Next.js & React', level: 'Advanced' },
  { name: 'n8n / Zapier / Make', level: 'Advanced' },
  { name: 'Playwright E2E testing', level: 'Advanced' },
  { name: '.NET', level: 'Intermediate' },
];

export type SkillGroup = {
  id: string;
  label: string;
  blurb: string;
  skills: Skill[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'ai-automation',
    label: 'AI & Automation',
    blurb: 'Where the manual work goes to die — agents, integrations, scheduled operations.',
    skills: [
      { name: 'n8n', level: 'Advanced' },
      { name: 'Zapier', level: 'Advanced' },
      { name: 'Make', level: 'Advanced' },
      { name: 'LLM & API integration', level: 'Advanced' },
      { name: 'Workflow architecture', level: 'Advanced' },
      { name: 'GitHub Copilot', level: 'Advanced' },
      { name: 'Claude Code', level: 'Advanced' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend & Data',
    blurb: 'Schema design, API layers, and the queries underneath them.',
    skills: [
      { name: 'Node.js', level: 'Advanced' },
      { name: 'Express.js', level: 'Advanced' },
      { name: 'PostgreSQL', level: 'Advanced' },
      { name: 'REST API design', level: 'Advanced' },
      { name: 'Auth & role-based access', level: 'Advanced' },
      { name: 'Webhooks & integrations', level: 'Advanced' },
      { name: '.NET', level: 'Intermediate' },
      { name: 'Firebase', level: 'Intermediate' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    blurb: 'Interfaces that stay maintainable once the feature count grows.',
    skills: [
      { name: 'React.js', level: 'Advanced' },
      { name: 'Next.js', level: 'Advanced' },
      { name: 'TypeScript', level: 'Advanced' },
      { name: 'JavaScript (ES6+)', level: 'Advanced' },
      { name: 'HTML5', level: 'Expert' },
      { name: 'CSS3', level: 'Expert' },
      { name: 'Astro.js', level: 'Intermediate' },
    ],
  },
  {
    id: 'testing',
    label: 'Testing & QA',
    blurb: 'Releases that don’t depend on someone remembering to click through.',
    skills: [
      { name: 'Playwright', level: 'Advanced' },
      { name: 'End-to-end testing', level: 'Advanced' },
      { name: 'Regression suites', level: 'Advanced' },
      { name: 'Manual QA', level: 'Advanced' },
      { name: 'Defect documentation', level: 'Advanced' },
    ],
  },
  {
    id: 'infra',
    label: 'Deployment & Infra',
    blurb: 'Getting it onto a server and keeping it there.',
    skills: [
      { name: 'Vercel', level: 'Advanced' },
      { name: 'Netlify', level: 'Advanced' },
      { name: 'Environment & secrets config', level: 'Advanced' },
      { name: 'Cloudflare', level: 'Intermediate' },
      { name: 'Linux servers', level: 'Intermediate' },
      { name: 'CI/CD basics', level: 'Intermediate' },
    ],
  },
  {
    id: 'tooling',
    label: 'Styling & Tooling',
    blurb: 'Design systems, responsive layout, and the daily drivers.',
    skills: [
      { name: 'Tailwind CSS', level: 'Advanced' },
      { name: 'SCSS', level: 'Advanced' },
      { name: 'Bootstrap', level: 'Advanced' },
      { name: 'Git & GitHub', level: 'Advanced' },
      { name: 'VS Code', level: 'Expert' },
      { name: 'Figma', level: 'Intermediate' },
      { name: 'C / C++', level: 'Advanced' },
    ],
  },
];

/** Not proficiency bars — these are working habits, shown as a separate row. */
export const strengths = [
  {
    title: 'End to end',
    body: 'Schema through to deployment. No hand-off gap where a feature stalls waiting on someone else’s layer.',
  },
  {
    title: 'Automation first',
    body: 'Prefer removing a manual step entirely over making it slightly faster.',
  },
  {
    title: 'Tested, not hoped',
    body: 'Critical paths covered by Playwright so a release doesn’t rest on manual clicking.',
  },
  {
    title: 'Performance',
    body: 'Load time, render latency and redundant queries are treated as bugs, not polish.',
  },
];

/** Flat list for the marquee. Derived so it can never drift from the groups. */
export const allSkillNames = Array.from(
  new Set(skillGroups.flatMap((g) => g.skills.map((s) => s.name))),
);
