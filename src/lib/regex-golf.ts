/**
 * Regex golf — match every string on the left, reject every one on the right,
 * in as few characters as possible.
 *
 * Running a visitor's regex is the interesting engineering problem here, not
 * the puzzle. A pattern like /(a+)+$/ against a non-matching string backtracks
 * exponentially and locks the tab solid — the classic ReDoS. Since the whole
 * point of this exhibit is that people type arbitrary patterns into it, it
 * screens for nested unbounded quantifiers *before* executing anything, and
 * says why rather than just refusing.
 */

export type Level = {
  id: string;
  title: string;
  brief: string;
  /** Must all match. */
  match: string[];
  /** Must all fail to match. */
  reject: string[];
  /** A known-good solution's length — the score to beat. */
  par: number;
  /** Used only by the tests, to prove each level is actually solvable. */
  reference: string;
};

export type Result = {
  /** The pattern compiled and was safe to run. */
  valid: boolean;
  error?: string;
  /** Strings that should have matched and did. */
  hits: string[];
  /** Strings that should have matched and didn't. */
  misses: string[];
  /** Strings that should have been rejected but matched. */
  falsePositives: string[];
  length: number;
  solved: boolean;
};

type Atom = { atom: string; quant: string };

/**
 * Split a pattern into top-level atoms and their quantifiers.
 *
 * Escapes, character classes and groups are single atoms, so `\(`, `[a-z]` and
 * `(ab|cd)` are each one unit — which is what stops an escaped paren being
 * mistaken for a group.
 */
const atomise = (source: string): Atom[] => {
  const out: Atom[] = [];
  let i = 0;

  while (i < source.length) {
    let atom: string;
    const ch = source[i];

    if (ch === '\\') {
      atom = source.slice(i, i + 2);
      i += 2;
    } else if (ch === '[') {
      let j = i + 1;
      if (source[j] === '^') j++;
      if (source[j] === ']') j++; // a leading ] is a literal
      while (j < source.length && source[j] !== ']') {
        if (source[j] === '\\') j++;
        j++;
      }
      atom = source.slice(i, j + 1);
      i = j + 1;
    } else if (ch === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < source.length && depth > 0) {
        if (source[j] === '\\') {
          j += 2;
          continue;
        }
        if (source[j] === '(') depth++;
        else if (source[j] === ')') depth--;
        j++;
      }
      atom = source.slice(i, j);
      i = j;
    } else {
      atom = ch;
      i++;
    }

    let quant = '';
    const q = source[i];
    if (q === '*' || q === '+' || q === '?') {
      quant = q;
      i++;
    } else if (q === '{') {
      const close = source.indexOf('}', i);
      if (close > -1) {
        quant = source.slice(i, close + 1);
        i = close + 1;
      }
    }
    // Swallow a lazy/possessive modifier — it doesn't change the analysis.
    if (quant && (source[i] === '?' || source[i] === '+')) i++;

    out.push({ atom, quant });
  }

  return out;
};

const isUnbounded = (quant: string) => quant === '*' || quant === '+' || /^\{\d+,\}$/.test(quant);

/** Split on top-level `|`, ignoring bars inside groups or classes. */
const branches = (source: string): string[] =>
  atomise(source)
    .reduce<string[]>(
      (acc, a) => {
        if (a.atom === '|' && !a.quant) acc.push('');
        else acc[acc.length - 1] += a.atom + a.quant;
        return acc;
      },
      [''],
    )
    .filter((b) => b.length > 0);

/**
 * Is every part of this expression optional-and-repeating?
 *
 * This is the real discriminator. `(a+)+` is catastrophic because the inner and
 * outer loops can partition the same run of `a`s exponentially many ways.
 * `(-[a-z]+)+` is not, because each repetition must consume a literal `-` — the
 * mandatory atom anchors it, so there is only one way to split the input.
 *
 * So: dangerous only when a branch consists *entirely* of unbounded repeats,
 * with nothing mandatory to pin it down.
 */
const isAmbiguousRepeat = (source: string): boolean =>
  branches(source).some((branch) => {
    const parts = atomise(branch).filter((p) => p.atom !== '^' && p.atom !== '$');
    return parts.length > 0 && parts.every((p) => isUnbounded(p.quant));
  });

/**
 * Heuristic ReDoS screen.
 *
 * Flags an unbounded quantifier applied to a group whose body is itself all
 * unbounded repeats — the shape that backtracks exponentially and locks the
 * tab. Recurses, so a nested offender is still caught.
 *
 * Still a heuristic, and deliberately biased toward refusing: freezing
 * someone's browser is worse than asking them to write it differently, and the
 * message says which.
 */
export const looksCatastrophic = (pattern: string): boolean => {
  for (const { atom, quant } of atomise(pattern)) {
    if (!atom.startsWith('(')) continue;

    // Strip BOTH parens — the atomiser includes the closing one — then any
    // (?:, (?<name>, lookaround prefix.
    const body = atom
      .slice(1, atom.endsWith(')') ? -1 : undefined)
      .replace(/^(\?:|\?<[^>]*>|\?=|\?!|\?<=|\?<!)/, '');
    if (isUnbounded(quant) && isAmbiguousRepeat(body)) return true;
    if (looksCatastrophic(body)) return true; // nested offender
  }
  return false;
};

export const MAX_PATTERN = 80;

export const evaluate = (pattern: string, level: Level): Result => {
  const base: Result = {
    valid: false,
    hits: [],
    misses: [],
    falsePositives: [],
    length: pattern.length,
    solved: false,
  };

  if (!pattern) return { ...base, error: 'Write a pattern.' };
  if (pattern.length > MAX_PATTERN) {
    return { ...base, error: `Keep it under ${MAX_PATTERN} characters — this is golf.` };
  }
  if (looksCatastrophic(pattern)) {
    return {
      ...base,
      error:
        'Refused: a repeated group that already repeats can backtrack exponentially and freeze the tab (ReDoS). Try it without the nested quantifier.',
    };
  }

  let re: RegExp;
  try {
    re = new RegExp(pattern);
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : 'Invalid pattern.' };
  }

  const hits: string[] = [];
  const misses: string[] = [];
  const falsePositives: string[] = [];

  for (const s of level.match) (re.test(s) ? hits : misses).push(s);
  for (const s of level.reject) if (re.test(s)) falsePositives.push(s);

  return {
    valid: true,
    hits,
    misses,
    falsePositives,
    length: pattern.length,
    solved: misses.length === 0 && falsePositives.length === 0,
  };
};

/**
 * `par` is DERIVED from the reference solution, never written by hand — the
 * first draft hand-counted five of the six wrong, and a par that disagrees with
 * the solution it describes is worse than no par at all.
 */
const RAW: Array<Omit<Level, 'par'>> = [
  {
    id: 'plosive',
    title: 'Plosives',
    brief: 'Match the words on the left, reject the ones on the right.',
    match: ['pop', 'pip', 'pup', 'pep'],
    reject: ['top', 'tip', 'cup', 'keg'],
    par: 3,
    reference: '^p',
  },
  {
    id: 'doubles',
    title: 'Double trouble',
    brief: 'Every word on the left contains a doubled letter.',
    match: ['ball', 'kitten', 'sheep', 'buzz'],
    reject: ['balm', 'kite', 'shed', 'buz'],
    par: 7,
    reference: '(.)\\1',
  },
  {
    id: 'ends',
    title: 'Ends of the earth',
    brief: 'Left-hand words end in a vowel. Right-hand ones do not.',
    match: ['java', 'scale', 'ruby', 'go'],
    reject: ['rust', 'perl', 'swift', 'zig'],
    par: 8,
    reference: '[aeiouy]$',
  },
  {
    id: 'ports',
    title: 'Well-known ports',
    brief: 'Match the three-or-four digit numbers on the left only.',
    match: ['443', '8080', '5432', '3000'],
    reject: ['22', '80', '65536', 'http'],
    par: 10,
    reference: '^\\d{3,4}$',
  },
  {
    id: 'semver',
    title: 'Semver',
    brief: 'Match versions with all three parts.',
    match: ['1.0.0', '18.2.11', '0.0.1', '10.4.3'],
    reject: ['1.0', 'v1.0.0', '1..0', '1.0.0.0'],
    par: 18,
    reference: '^\\d+\\.\\d+\\.\\d+$',
  },
  {
    id: 'kebab',
    title: 'Kebab, not snake',
    brief: 'Match kebab-case identifiers; reject snake_case and camelCase.',
    match: ['hero-section', 'dot-field', 'lab-page', 'a-b'],
    reject: ['hero_section', 'dotField', 'LabPage', 'a b'],
    reference: '^[a-z]+(-[a-z]+)+$',
  },
];

export const LEVELS: Level[] = RAW.map((l) => ({ ...l, par: l.reference.length }));
