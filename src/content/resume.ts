import { experience } from '@/content/experience';
import { projects } from '@/content/projects';
import { site, socials } from '@/content/site';
import { skillGroups } from '@/content/skills';

/**
 * The résumé document.
 *
 * A résumé is a *curated* view of the site, not a dump of it — so this module
 * exists rather than the templates reading `projects.ts` directly. Two rules:
 *
 * 1. **Facts are derived, prose is authored.** Titles, clients, years, periods
 *    and stacks are pulled from the content modules by id, so they cannot drift
 *    from the site. Only the condensed body text is written here, because a CV
 *    line and a case-study paragraph are genuinely different objects — the site's
 *    `detail` runs 60+ words and a résumé entry has room for about 25.
 *
 * 2. **Omissions are explicit and commented.** Anything left out is left out on
 *    purpose, with the reason next to it. Silent filtering is how a résumé ends
 *    up quietly contradicting the portfolio it links to.
 *
 * OMITTED DELIBERATELY (Sahil's call, 2026-08-01):
 *  - **All QA and all testing.** The vDoctor engagement is gone, the whole
 *    "Testing & QA" skill group is dropped, Playwright is stripped from every
 *    project stack, and any experience bullet or project sentence about tests is
 *    filtered out. This is broader than it first looks, which is exactly why it
 *    is enforced by `TESTING_PATTERN` below rather than by hand — a single
 *    forgotten "covered by end-to-end tests" defeats the whole request.
 *    Note this is a résumé-only edit: the site still says all of it, because it
 *    is true and it is what makes the ERP work credible there.
 *  - Wellnessta and Shreenathji Tech as standalone entries. They are folded into
 *    one "client platforms" line instead, so the page leads with the ERPs rather
 *    than burying them under seven smaller projects.
 */

export type ResumeEntry = {
  id: string;
  title: string;
  org: string;
  period: string;
  sub: string;
  points: string[];
};

export type ResumeProject = {
  id: string;
  title: string;
  meta: string;
  body: string;
  stack: string;
};

export type ResumeSkillRow = { id: string; label: string; items: string };

/**
 * One contact detail. `href` is what makes it clickable in the PDF — Chrome's
 * print pipeline turns an `<a href>` into a real link annotation, so the email
 * opens a mail client and the GitHub line opens GitHub straight from the file.
 */
export type ContactItem = { label: string; href?: string };

/**
 * Works out the link for a contact line the user typed.
 *
 * The editor exposes contact lines as plain text ("a · b · c") because asking
 * someone to maintain a URL beside every visible string is a worse trade than
 * inferring it. Everything here is inferable, and anything that isn't — a city,
 * a job title — correctly gets no link rather than a guessed one.
 */
export const hrefFor = (label: string): string | undefined => {
  const value = label.trim();
  if (!value) return undefined;

  if (value.includes('@') && !value.includes(' ')) return `mailto:${value}`;

  /* Phone numbers need the unspaced E.164 form to actually dial — the same
     display-vs-dial split as `site.phone` / `site.phoneHref`. Requiring a
     leading + keeps this from swallowing years and postcodes. */
  if (/^\+[\d\s\-()]{7,}$/.test(value)) return `tel:${value.replace(/[^\d+]/g, '')}`;

  if (/^https?:\/\//i.test(value)) return value;
  // A bare domain — "github.com/x", "linkedin.com/in/y", "sahil.dev".
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`;

  return undefined;
};

export type ResumeDoc = {
  name: string;
  role: string;
  /** Rendered as separate lines — reachable-by-phone, then findable-online. */
  contactLines: ContactItem[][];
  profile: string;
  experience: ResumeEntry[];
  projects: ResumeProject[];
  skills: ResumeSkillRow[];
  education: ResumeEntry[];
  note: string;
};

/* -------------------------------------------------------------------------- */
/*  Derivation helpers                                                         */
/* -------------------------------------------------------------------------- */

const entry = (id: string): (typeof experience)[number] => {
  const found = experience.find((e) => e.id === id);
  if (!found) throw new Error(`resume: no experience entry "${id}"`);
  return found;
};

const project = (id: string): (typeof projects)[number] => {
  const found = projects.find((p) => p.id === id);
  if (!found) throw new Error(`resume: no project "${id}"`);
  return found;
};

/** "Adorn Clinic, Ahmedabad · 2026 · in development" — assembled, never typed. */
const projectMeta = (id: string) => {
  const p = project(id);
  const status =
    p.status === 'in-development' ? 'in development' : p.status === 'internal' ? 'internal' : 'live';
  return [p.client, p.year, status].filter(Boolean).join(' · ');
};

const stackOf = (id: string, drop: string[] = []) =>
  project(id)
    .tags.filter((t) => !drop.includes(t) && !TESTING_PATTERN.test(t))
    .join(' · ');

/** The profile URL already stated in `socials`, so the résumé can't link elsewhere. */
const socialHref = (name: string) => socials.find((s) => s.name === name)?.href;

/**
 * Everything test- and QA-related, matched rather than listed.
 *
 * The vocabulary is scattered — "Playwright", "end-to-end", "regression suite",
 * "manual QA", "defect documentation", plus prose like "covered by end-to-end
 * tests" — and it appears in skills, in stacks, in experience bullets and mid
 * sentence in project copy. Enumerating the strings by hand is how one of them
 * survives; one predicate applied at every point of entry is how none does.
 */
const TESTING_PATTERN =
  /playwright|end[- ]to[- ]end|\be2e\b|regression|\bqa\b|\btests?\b|testing|defect/i;

/** Whole skill groups that must not appear. */
const EXCLUDED_SKILL_GROUPS = ['testing'];

/**
 * Bullets where testing is a clause, not the point.
 *
 * "Own the whole vertical: database schema, API layer, front end, automated
 * tests and deployment" is one of the strongest lines on the résumé and it
 * mentions tests in passing — dropping it wholesale to honour the no-testing
 * rule would cost far more than it saves. Rewritten, then filtered.
 *
 * Keyed on the exact source string: if `experience.ts` changes, the rewrite
 * stops matching and the bullet is simply dropped by the filter instead. That
 * fails toward the instruction rather than against it.
 */
const REWRITES: Record<string, string> = {
  'Own the whole vertical: database schema, API layer, front end, automated tests and deployment':
    'Own the whole vertical: database schema, API layer, front end and deployment',
};

/** Rewrites what can be salvaged, then drops what is left. */
const withoutTesting = (points: string[]) =>
  points.map((p) => REWRITES[p] ?? p).filter((p) => !TESTING_PATTERN.test(p));

/* -------------------------------------------------------------------------- */
/*  The document                                                               */
/* -------------------------------------------------------------------------- */

export const defaultResume: ResumeDoc = {
  name: site.name,
  role: site.role,
  /* hrefs are stated rather than inferred here so the phone uses `phoneHref`
     (the E.164 dial form) and the socials use the exact URLs already in
     `socials` — `hrefFor` is the fallback for anything typed in the editor. */
  contactLines: [
    [
      { label: site.phone, href: site.phoneHref },
      { label: site.email, href: `mailto:${site.email}` },
      { label: `${site.location}, India` },
    ],
    [
      { label: 'github.com/sahiltalaviya99', href: socialHref('GitHub') },
      { label: 'linkedin.com/in/sahil-talaviya-99o9657o18', href: socialHref('LinkedIn') },
    ],
  ],
  profile:
    'I build complete systems end to end — front end, backend, API, database, deployment — and the AI automation that runs them without anyone touching a spreadsheet. Currently building enterprise ERP platforms across three industries: HVAC services, aesthetic healthcare and candle manufacturing. Comfortable owning the whole vertical rather than one layer of it, and I treat load time, render latency and redundant queries as bugs rather than polish.',

  experience: [
    {
      id: 'proofeasy',
      title: entry('proofeasy').title,
      org: entry('proofeasy').org,
      period: entry('proofeasy').period,
      sub: 'Enterprise ERP systems, schema through deployment, across three industries.',
      points: withoutTesting(entry('proofeasy').points),
    },
    {
      id: 'itechnotion',
      title: entry('itechnotion').title,
      org: entry('itechnotion').org,
      period: entry('itechnotion').period,
      sub: "Live client platforms in healthcare, wellness and email automation, plus the company's internal automation layer.",
      points: withoutTesting(entry('itechnotion').points),
    },
    {
      id: 'ibm-skillbuild',
      title: entry('ibm-skillbuild').title,
      org: entry('ibm-skillbuild').org,
      period: entry('ibm-skillbuild').period,
      sub: 'Fifteen-day intensive bootcamp on applied AI and machine learning.',
      points: withoutTesting(entry('ibm-skillbuild').points),
    },
  ],

  projects: [
    {
      id: 'adorn-hospital-erp',
      title: project('adorn-hospital-erp').title,
      meta: projectMeta('adorn-hospital-erp'),
      body: 'Two-branch hospital ERP covering appointments, patient records, a ten-bed inpatient ward and clinical support in one data model — so walk-in consultation flow and admitted-patient care are handled by the same system. Built across the whole stack, from the PostgreSQL schema through the API to the interface.',
      stack: stackOf('adorn-hospital-erp', ['Healthcare']),
    },
    {
      id: 'sahaj-cooling-erp',
      title: project('sahaj-cooling-erp').title,
      meta: projectMeta('sahaj-cooling-erp'),
      body: 'Full-surface ERP for an HVAC, refrigeration and electronics firm operating since 1969 across hospitals, automotive, retail and real estate. The brief was complete operational coverage rather than one department, replacing fragmented departmental tooling.',
      stack: stackOf('sahaj-cooling-erp', ['HVAC', 'Enterprise']),
    },
    {
      id: 'awax-manufacturing-erp',
      title: project('awax-manufacturing-erp').title,
      meta: projectMeta('awax-manufacturing-erp'),
      body: 'Manufacturing ERP for a scented-candle producer running three channels in parallel — order-driven retail, batch-driven wholesale and quote-driven custom production. Production, inventory and order flow are modelled to hold for all three rather than forcing one shape onto the others.',
      stack: stackOf('awax-manufacturing-erp', ['Manufacturing']),
    },
    {
      id: 'automation-suite',
      title: 'HR, Sales & Marketing Automation Suite',
      meta: projectMeta('automation-suite'),
      body: 'Seven connected n8n workflows forming an operational backbone rather than one tool: sheet-triggered estimates and invoices through Zoho Books, an HR inbox agent that classifies mail and replies to candidates with matching openings, job posts fanned out to email and social, probation reviews scheduled automatically, and HR documents generated from maintained templates.',
      stack: 'n8n · Zoho Books · Google Workspace APIs · Brevo',
    },
    {
      /* Three client platforms compressed into one entry. Individually they are
         strong; listed separately they pushed the ERPs down the page, which is
         the opposite of what this résumé is for. */
      id: 'client-platforms',
      title: 'Client platforms — Evolved Human Care, InboxPlus, Wellnessta',
      meta: 'iTechNotion · 2025 · live',
      body: 'Telehealth consultation booking with real-time appointment state across doctor and patient; an email-automation platform whose drag-and-drop workflow canvas I rebuilt for lower UI latency on large graphs; and a spa booking platform stabilised end to end — crash fixes, a debounced search that cut API traffic substantially, and a reworked booking flow.',
      stack: 'React · REST APIs · Webhooks · Real-time · Performance',
    },
  ],

  skills: skillGroups
    .filter((g) => !EXCLUDED_SKILL_GROUPS.includes(g.id))
    .map((g) => ({
      id: g.id,
      label: g.label,
      // Individual test-related skills can sit in other groups too.
      items: g.skills
        .map((s) => s.name)
        .filter((n) => !TESTING_PATTERN.test(n))
        .join(' · '),
    }))
    .filter((g) => g.items.length > 0),

  education: experience
    .filter((e) => e.type === 'education')
    .map((e) => ({
      id: e.id,
      title: e.title,
      org: e.org,
      period: e.period,
      /* The source bullets carry no terminal punctuation — they are rendered as
         list items on the site. Joined raw they ran together as "…database
         systems Elective focus on…". */
      sub: `${e.points.map((p) => p.replace(/\.\s*$/, '')).join('. ')}.`,
      points: [],
    })),

  note: 'Interactive work — a browser-based SQL engine, a pathfinding comparison, a BM25 search index and an assembler with its own VM, all built from scratch — is runnable at the /lab route of the portfolio.',
};

/** Deep copy, so an editor mutating its draft can never scribble on the module. */
export const cloneResume = (doc: ResumeDoc): ResumeDoc =>
  JSON.parse(JSON.stringify(doc)) as ResumeDoc;
