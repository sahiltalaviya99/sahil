/**
 * Storage that can't take the page down with it.
 *
 * `sessionStorage` / `localStorage` are not merely empty when a browser blocks
 * site data — *reading the property itself* throws `SecurityError: Access is
 * denied for this document`. That happens with "block third-party cookies and
 * site data", strict privacy modes, some enterprise policies, and inside
 * sandboxed iframes.
 *
 * An unguarded read in a component effect therefore throws during commit, and
 * React unmounts the whole root — the entire site goes blank because of a
 * cosmetic preference. Every access on the site goes through here instead.
 *
 * Failing to read means "no preference stored"; failing to write means the
 * preference doesn't persist. Both are fine. A blank page is not.
 */

type Kind = 'session' | 'local';

const store = (kind: Kind): Storage | null => {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    // Property access itself was denied.
    return null;
  }
};

export const safeGet = (key: string, kind: Kind = 'session'): string | null => {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const safeSet = (key: string, value: string, kind: Kind = 'session'): void => {
  try {
    // Still throws past quota even when the property is readable.
    store(kind)?.setItem(key, value);
  } catch {
    /* Preference simply doesn't persist — not worth surfacing. */
  }
};
