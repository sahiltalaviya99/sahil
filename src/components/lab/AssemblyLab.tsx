import { useMemo, useState } from 'react';
import { Check, CircleAlert, Cpu, Play, RotateCcw } from 'lucide-react';

import { INSTRUCTION_HELP, PUZZLES, REGISTERS, run, type Puzzle } from '@/lib/asm';
import { cn } from '@/lib/utils';

/**
 * Write assembly, run it on a virtual machine, hit the target output.
 *
 * Eight instructions, four registers, labels and jumps. The VM is a real
 * two-stage pipeline — assemble, then execute — which is what makes the error
 * reporting honest: an unknown label is caught with its source line before
 * anything runs, rather than surfacing halfway through as a crash.
 *
 * Everything lives in lib/asm.ts and is tested in Node, including that each
 * puzzle here is actually solvable with this instruction set.
 */
export const AssemblyLab = () => {
  const [puzzle, setPuzzle] = useState<Puzzle>(PUZZLES[0]);
  const [source, setSource] = useState(PUZZLES[0].starter);
  const [result, setResult] = useState<ReturnType<typeof run> | null>(null);

  const pick = (p: Puzzle) => {
    setPuzzle(p);
    setSource(p.starter);
    setResult(null);
  };

  const solved = useMemo(
    () => result != null && JSON.stringify(result.output) === JSON.stringify(puzzle.expected),
    [result, puzzle],
  );

  return (
    <div className="surface overflow-hidden">
      {/* Puzzles */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 bg-elevated/40 p-3">
        {PUZZLES.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            className={cn(
              'rounded-full border px-2.5 py-1 font-mono text-[0.62rem] transition-colors',
              puzzle.id === p.id
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        {/* Editor */}
        <div className="min-w-0 border-b border-border/70 p-4 lg:border-b-0 lg:border-r sm:p-5">
          <p className="text-sm text-muted-foreground">{puzzle.brief}</p>
          <p className="mt-1.5 font-mono text-[0.68rem] text-muted-foreground/60">
            target: {puzzle.expected.join(' ')}
          </p>

          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={12}
            aria-label="Assembly source"
            className="mt-3 w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground outline-none transition-colors focus:border-primary/50"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => setResult(run(source))} className="btn-primary px-4 py-2 text-sm">
              <Play className="h-3.5 w-3.5" />
              Run
            </button>
            <button
              onClick={() => {
                setSource(puzzle.starter);
                setResult(null);
              }}
              className="btn-ghost px-3 py-2 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {/* Output */}
          {result && (
            <div className="mt-4">
              {result.error ? (
                <p className="flex items-start gap-2 rounded-lg bg-destructive/[0.09] px-3 py-2 font-mono text-xs text-destructive">
                  <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>
                    {result.errorLine !== undefined && (
                      <span className="text-destructive/70">line {result.errorLine}: </span>
                    )}
                    {result.error}
                  </span>
                </p>
              ) : null}

              <div
                className={cn(
                  'mt-2 rounded-xl border p-3 font-mono text-xs',
                  solved ? 'border-primary/40 bg-primary/[0.07]' : 'border-border bg-background',
                )}
              >
                <p className="mb-1.5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/60">
                  Output
                </p>
                <p className="break-words text-foreground">
                  {result.output.length ? result.output.join(' ') : <span className="text-muted-foreground/40">(nothing printed)</span>}
                </p>

                {solved && (
                  <p className="mt-2 flex items-center gap-1.5 text-primary">
                    <Check className="h-3.5 w-3.5" />
                    Correct — {result.steps} instruction{result.steps === 1 ? '' : 's'} executed
                  </p>
                )}
              </div>

              {/* Final register state — the thing you actually debug with. */}
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-[0.66rem] text-muted-foreground/70">
                {REGISTERS.map((r) => (
                  <span key={r}>
                    {r} <span className="tabular-nums text-primary/80">{result.registers[r]}</span>
                  </span>
                ))}
                <span className="tabular-nums">{result.steps} steps</span>
              </div>
            </div>
          )}
        </div>

        {/* Reference */}
        <aside className="bg-elevated/20 p-4">
          <p className="mb-3 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            Instruction set
          </p>
          <dl className="space-y-2">
            {INSTRUCTION_HELP.map((h) => (
              <div key={h.syntax}>
                <dt className="font-mono text-[0.68rem] text-primary/90">{h.syntax}</dt>
                <dd className="text-[0.68rem] leading-snug text-muted-foreground/70">
                  {h.describe}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-border/60 pt-3 text-[0.66rem] leading-relaxed text-muted-foreground/60">
            Registers A–D all start at zero. A runaway loop is stopped by a step cap rather
            than hanging the tab.
          </p>
        </aside>
      </div>
    </div>
  );
};
