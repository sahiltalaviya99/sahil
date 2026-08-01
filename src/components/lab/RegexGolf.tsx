import { useMemo, useState } from 'react';
import { Check, Lightbulb, ShieldAlert, X } from 'lucide-react';

import { LEVELS, evaluate, type Level } from '@/lib/regex-golf';
import { cn } from '@/lib/utils';

/**
 * Regex golf: match everything on the left, reject everything on the right,
 * in as few characters as possible.
 *
 * The engineering interest is in running a stranger's regex at all. `(a+)+$`
 * against a non-matching string backtracks exponentially and locks the tab —
 * the classic ReDoS — so patterns are screened before execution and refused
 * with an explanation rather than silently freezing. That screen is the most
 * heavily tested part of lib/regex-golf.ts.
 */
export const RegexGolf = () => {
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [pattern, setPattern] = useState('');
  const [showHint, setShowHint] = useState(false);

  const result = useMemo(() => evaluate(pattern, level), [pattern, level]);

  const pick = (l: Level) => {
    setLevel(l);
    setPattern('');
    setShowHint(false);
  };

  const underPar = result.solved && result.length <= level.par;

  return (
    <div className="surface overflow-hidden">
      {/* Levels */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 bg-elevated/40 p-3">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => pick(l)}
            className={cn(
              'rounded-full border px-2.5 py-1 font-mono text-[0.62rem] transition-colors',
              level.id === l.id
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {l.title}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">{level.brief}</p>

        {/* Input */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm transition-colors focus-within:border-primary/50">
          <span className="text-muted-foreground/50">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="your pattern"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Regular expression"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-muted-foreground/50">/</span>
          <span
            className={cn(
              'ml-2 shrink-0 tabular-nums text-[0.7rem]',
              underPar ? 'text-primary' : 'text-muted-foreground/60',
            )}
          >
            {result.length}/{level.par}
          </span>
        </div>

        {result.error && (
          <p
            className={cn(
              'mt-2 flex items-start gap-2 rounded-lg px-3 py-2 font-mono text-[0.68rem] leading-relaxed',
              /ReDoS/.test(result.error)
                ? 'bg-destructive/[0.09] text-destructive'
                : 'text-muted-foreground/70',
            )}
          >
            {/ReDoS/.test(result.error) && <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" />}
            {result.error}
          </p>
        )}

        {/* The two columns */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-primary/70">
              Must match
            </p>
            <ul className="space-y-1">
              {level.match.map((s) => {
                const hit = result.valid && result.hits.includes(s);
                return (
                  <li
                    key={s}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-xs transition-colors',
                      hit ? 'bg-primary/12 text-foreground' : 'bg-elevated/50 text-muted-foreground',
                    )}
                  >
                    {hit ? (
                      <Check className="h-3 w-3 shrink-0 text-primary" />
                    ) : (
                      <span className="h-3 w-3 shrink-0" />
                    )}
                    {s}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground/60">
              Must not match
            </p>
            <ul className="space-y-1">
              {level.reject.map((s) => {
                const caught = result.valid && result.falsePositives.includes(s);
                return (
                  <li
                    key={s}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-xs transition-colors',
                      caught
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-elevated/50 text-muted-foreground',
                    )}
                  >
                    {caught ? (
                      <X className="h-3 w-3 shrink-0" />
                    ) : (
                      <span className="h-3 w-3 shrink-0" />
                    )}
                    {s}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Verdict */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          {result.solved ? (
            <p className="font-mono text-xs text-primary">
              Solved in {result.length} characters
              {underPar
                ? result.length < level.par
                  ? ` — ${level.par - result.length} under par`
                  : ' — exactly par'
                : ` — par is ${level.par}`}
            </p>
          ) : (
            <p className="font-mono text-xs text-muted-foreground/60">
              {result.valid
                ? `${result.misses.length} missed · ${result.falsePositives.length} false positive${result.falsePositives.length === 1 ? '' : 's'}`
                : 'Waiting for a valid pattern.'}
            </p>
          )}

          <button
            onClick={() => setShowHint((v) => !v)}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            <Lightbulb className="h-3 w-3" />
            {showHint ? 'Hide answer' : 'Show an answer'}
          </button>
        </div>

        {showHint && (
          <p className="mt-2 rounded-lg bg-elevated/60 px-3 py-2 font-mono text-xs text-muted-foreground">
            /{level.reference}/ — one solution at par. Shorter ones exist.
          </p>
        )}
      </div>

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/70">
        Patterns are screened for catastrophic backtracking before they run. A repeated
        group whose body is <em>entirely</em> repeats — <span className="font-mono">(a+)+</span> —
        can take exponential time on a string that doesn&apos;t match, which is how a regex
        freezes a browser tab. One with something mandatory in it, like{' '}
        <span className="font-mono">(-[a-z]+)+</span>, is fine, and the screen knows the
        difference.
      </p>
    </div>
  );
};
