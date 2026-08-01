import { projects } from '@/content/projects';
import { experience } from '@/content/experience';
import { coreStack, skillGroups } from '@/content/skills';
import { site } from '@/content/site';

/**
 * BM25 ranked search over this site's own content.
 *
 * Deliberately *not* an LLM and deliberately not dressed up as a chatbot. This
 * is Okapi BM25 — the ranking function that actually powers Lucene, Elastic and
 * Postgres full-text search — computed client-side over the content modules,
 * with the per-term scores exposed so a visitor can see why a result ranked
 * where it did.
 *
 * Being honest about that is the point. A fake chat window that pattern-matches
 * canned answers is the sort of thing this site exists to avoid; a real ranking
 * function whose maths you can inspect is stronger evidence than a convincing
 * illusion.
 */

export type Doc = {
  id: string;
  title: string;
  kind: 'project' | 'experience' | 'skill' | 'about';
  /** Where a hit should send the visitor. */
  section: string;
  body: string;
};

/** Terms carrying no discriminating power — they'd only add noise to scores. */
const STOP = new Set(
  'a an the and or but of for to in on at by with from is are was were be been it its as that this i my me we our you your'.split(
    ' ',
  ),
);

/**
 * Light stemmer. Not Porter — just the plural/suffix collapsing that matters
 * here, so "automations", "automation" and "automated" land on one term.
 *
 * Technology names are exempt. Stemming "node.js" gives "node.j", which then
 * matches nothing — suffix rules are for English words, and a token carrying a
 * dot, plus, hash or digit isn't one.
 */
const stem = (w: string) => {
  if (/[.+#0-9]/.test(w)) return w;

  let s = w;
  if (s.length > 4 && s.endsWith('ies')) return `${s.slice(0, -3)}y`;
  if (s.length > 4 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith('es')) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith('s')) s = s.slice(0, -1);
  return s;
};

export const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    // Keep dots, pluses and hashes so "node.js", "c++", "c#" and ".net" survive.
    .split(/[^a-z0-9.+#]+/)
    // A leading dot is part of the name, not punctuation: fold ".net" onto
    // "dotnet" so both spellings of the query find it.
    .map((t) => (/^\.[a-z]/.test(t) ? `dot${t.slice(1)}` : t))
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(stem);

export const DOCS: Doc[] = [
  {
    id: 'about',
    title: `${site.name} — ${site.role}`,
    kind: 'about',
    section: 'about',
    body: `${site.tagline} ${site.roles.join(' ')} ${site.company} ${site.location}`,
  },
  ...projects.map<Doc>((p) => ({
    id: p.id,
    title: p.title,
    kind: 'project',
    section: 'work',
    body: [p.summary, p.detail, p.role, p.outcome, p.client ?? '', p.tags.join(' '), p.kind, p.year]
      .join(' ')
      .trim(),
  })),
  ...experience.map<Doc>((e) => ({
    id: e.id,
    title: `${e.title} — ${e.org}`,
    kind: 'experience',
    section: 'experience',
    body: [e.summary, e.points.join(' '), e.skills.join(' '), e.period, e.type].join(' '),
  })),
  ...[...coreStack, ...skillGroups.flatMap((g) => g.skills)].map<Doc>((s) => ({
    id: `skill-${s.name}`,
    title: s.name,
    kind: 'skill',
    section: 'skills',
    body: `${s.name} ${s.level}`,
  })),
];

/* ------------------------------------------------------------------ */
/*  Index                                                              */
/* ------------------------------------------------------------------ */

type Posting = { docIndex: number; tf: number };

const postings = new Map<string, Posting[]>();
const docLengths: number[] = [];
/** Title terms are worth more; kept separate so they can be boosted. */
const titleTerms: Set<string>[] = [];

DOCS.forEach((doc, i) => {
  const bodyTokens = tokenize(`${doc.title} ${doc.body}`);
  docLengths[i] = bodyTokens.length;
  titleTerms[i] = new Set(tokenize(doc.title));

  const counts = new Map<string, number>();
  for (const t of bodyTokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const [term, tf] of counts) {
    const list = postings.get(term);
    if (list) list.push({ docIndex: i, tf });
    else postings.set(term, [{ docIndex: i, tf }]);
  }
});

const AVG_LEN = docLengths.reduce((a, b) => a + b, 0) / (docLengths.length || 1);

/** Standard BM25 constants: k1 controls term-frequency saturation, b length normalisation. */
const K1 = 1.5;
const B = 0.75;
/** Multiplier applied when a query term also appears in the document title. */
const TITLE_BOOST = 1.6;

export type TermScore = { term: string; idf: number; tf: number; contribution: number };
export type SearchHit = {
  doc: Doc;
  score: number;
  /** Per-term breakdown, so the ranking is inspectable rather than magic. */
  terms: TermScore[];
  /** Body excerpt around the strongest match. */
  snippet: string;
};

const excerpt = (doc: Doc, queryTerms: string[]) => {
  const words = doc.body.split(/\s+/);
  const lower = words.map((w) => stem(w.toLowerCase().replace(/[^a-z0-9.+#]/g, '')));
  let best = 0;
  let bestHits = -1;
  const WINDOW = 26;
  for (let i = 0; i < Math.max(1, words.length - WINDOW); i += 4) {
    let hits = 0;
    for (let j = i; j < Math.min(i + WINDOW, lower.length); j++) {
      if (queryTerms.includes(lower[j])) hits++;
    }
    if (hits > bestHits) {
      bestHits = hits;
      best = i;
    }
  }
  const slice = words.slice(best, best + WINDOW).join(' ');
  return `${best > 0 ? '… ' : ''}${slice}${best + WINDOW < words.length ? ' …' : ''}`;
};

export const search = (query: string, limit = 8): SearchHit[] => {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];

  const N = DOCS.length;
  const scores = new Map<number, TermScore[]>();

  for (const term of terms) {
    const list = postings.get(term);
    if (!list) continue;

    // BM25 IDF, with the +1 that keeps it from going negative on terms
    // appearing in more than half the corpus.
    const idf = Math.log(1 + (N - list.length + 0.5) / (list.length + 0.5));

    for (const { docIndex, tf } of list) {
      const norm = tf * (K1 + 1);
      const denom = tf + K1 * (1 - B + (B * docLengths[docIndex]) / AVG_LEN);
      let contribution = idf * (norm / denom);
      if (titleTerms[docIndex].has(term)) contribution *= TITLE_BOOST;

      const entry = scores.get(docIndex) ?? [];
      entry.push({ term, idf, tf, contribution });
      scores.set(docIndex, entry);
    }
  }

  return [...scores.entries()]
    .map(([docIndex, termScores]) => ({
      doc: DOCS[docIndex],
      score: termScores.reduce((a, t) => a + t.contribution, 0),
      terms: [...termScores].sort((a, b) => b.contribution - a.contribution),
      snippet: excerpt(DOCS[docIndex], terms),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export const INDEX_STATS = {
  documents: DOCS.length,
  terms: postings.size,
  avgLength: Math.round(AVG_LEN),
};

export const SAMPLE_SEARCHES = [
  'hospital erp postgres',
  'playwright testing',
  'n8n automation workflow',
  'dotnet',
  'inventory manufacturing',
];
