import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui-kit/SectionHeading';
import { site } from '@/content/site';
import { useScrollToSection } from '@/hooks/use-section-nav';
import {
  BANNER,
  clearsScreen,
  complete,
  runCommand,
  type CommandContext,
  type Line,
} from '@/lib/terminal-commands';
import { promptPath } from '@/lib/terminal-fs';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

const lineClass: Record<Line['kind'], string> = {
  in: 'text-foreground',
  out: 'text-muted-foreground',
  err: 'text-destructive',
  accent: 'text-primary',
};

const BOOT: Line[] = [
  { kind: 'out', text: 'portfolio-sh 1.0 — booting…' },
  { kind: 'accent', text: '[  OK  ] Mounting virtual filesystem' },
  { kind: 'accent', text: '[  OK  ] Loading content modules: projects, experience, skills' },
  { kind: 'accent', text: '[  OK  ] Registering commands' },
  { kind: 'accent', text: '[  OK  ] Shell ready' },
  { kind: 'out', text: '' },
];

/**
 * An actually-working shell.
 *
 * `cd`, `ls`, `cat`, `grep`, `tree` and friends operate over a virtual
 * filesystem generated from the real content modules (lib/terminal-fs.ts) — so
 * the files under ~/projects ARE the projects rendered by the Work section and
 * can never drift out of sync.
 *
 * Supports tab completion, ↑/↓ history, Ctrl+L and fullscreen, because a shell
 * missing those feels fake within about four keystrokes.
 */
const TerminalSection = () => {
  const [lines, setLines] = useState<Line[]>([]);
  const [cwd, setCwd] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fullscreen, setFullscreen] = useState(false);
  const [booted, setBooted] = useState(false);
  // Tracked separately from the buffer: inferring it as `lines.length > …`
  // meant `clear`/`cls` emptied the screen and took the prompt with it, leaving
  // a terminal nobody could type into. See the note in HeroTerminal.
  const [ready, setReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-20% 0px' });
  const reduce = useReducedMotion();
  const scrollToSection = useScrollToSection();

  /* Boot sequence — runs once, when the section first scrolls into view.
     Deliberately not on mount: booting off-screen means visitors arrive to an
     already-finished log and never see it happen. */
  useEffect(() => {
    if (!inView || booted) return;
    setBooted(true);

    if (reduce) {
      setLines([...BOOT, ...BANNER]);
      setReady(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT.forEach((line, i) => {
      timers.push(setTimeout(() => setLines((prev) => [...prev, line]), i * 190));
    });
    timers.push(
      setTimeout(() => {
        setLines((prev) => [...prev, ...BANNER]);
        setReady(true);
      }, BOOT.length * 190 + 220),
    );

    return () => timers.forEach(clearTimeout);
  }, [inView, booted, reduce]);

  // Keep the newest output in view without pulling the page around it.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Escape leaves fullscreen; lock the page behind it while open.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      toast.success('Email copied to clipboard');
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  }, []);

  const submit = useCallback(
    (raw: string) => {
      const prompt = `${promptPath(cwd)} $ ${raw}`;
      const ctx: CommandContext = {
        cwd,
        setCwd,
        clear: () => setLines([]),
        scrollTo: (id) => {
          setFullscreen(false);
          scrollToSection(id);
        },
        copyEmail,
        history,
        toggleFullscreen: () => setFullscreen((v) => !v),
      };

      const result = runCommand(raw, ctx);

      // `clear` empties the buffer inside its own handler, so appending the
      // echoed prompt afterwards would immediately undo it.
      setLines((prev) =>
        clearsScreen(raw) ? [] : [...prev, { kind: 'in', text: prompt }, ...result],
      );

      if (raw.trim()) setHistory((h) => [raw, ...h].slice(0, 60));
      setHistoryIndex(-1);
      setInput('');
    },
    [cwd, scrollToSection, copyEmail, history],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(input);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const completed = complete(input, cwd);
      if (completed) setInput(completed);
      return;
    }

    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      if (next >= 0 && history[next] !== undefined) {
        setHistoryIndex(next);
        setInput(history[next]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = historyIndex - 1;
      if (next < 0) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(next);
        setInput(history[next] ?? '');
      }
    }
  };

  const hints: Array<[string, string]> = [
    ['help', 'commands'],
    ['ls', 'list'],
    ['tree', 'everything'],
    ['neofetch', 'summary'],
    ['theme azure', 'reskin'],
  ];

  /** The window itself — rendered inline, or portalled when fullscreen. */
  const terminal = (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        'glass flex flex-col overflow-hidden shadow-2xl',
        fullscreen ? 'h-full rounded-none' : 'rounded-2xl',
      )}
    >
      {/* Chrome */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-elevated/60 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]/70" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E]/70" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]/70" />
        <span className="ml-2 min-w-0 flex-1 truncate font-mono text-[0.66rem] tracking-wide text-muted-foreground">
          {site.shortName.toLowerCase()}@portfolio — {promptPath(cwd)}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setFullscreen((v) => !v);
          }}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-primary"
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Screen */}
      <div
        ref={scrollRef}
        className={cn(
          'no-scrollbar flex-1 overflow-auto bg-background/60 p-4 font-mono text-[0.72rem] leading-[1.65] sm:p-5 sm:text-[0.78rem]',
          !fullscreen && 'h-[26rem] sm:h-[30rem]',
        )}
      >
        {lines.map((line, i) => (
          <pre
            key={i}
            className={cn('whitespace-pre font-mono', lineClass[line.kind])}
          >
            {line.text || ' '}
          </pre>
        ))}

        {/* Prompt appears once the boot log has finished. */}
        {ready && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="shrink-0 text-primary">{promptPath(cwd)}</span>
            <span className="shrink-0 text-muted-foreground">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="Terminal input"
              className="min-w-0 flex-1 border-none bg-transparent font-mono text-foreground caret-primary outline-none placeholder:text-muted-foreground/40"
              placeholder="type 'help'…"
            />
          </div>
        )}
      </div>

      {/* Hint bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/[0.06] bg-elevated/40 px-4 py-2.5">
        {hints.map(([cmd, label]) => (
          <button
            key={cmd}
            onClick={(e) => {
              e.stopPropagation();
              submit(cmd);
              inputRef.current?.focus();
            }}
            className="group flex items-center gap-1.5 font-mono text-[0.6rem] text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="rounded border border-border bg-elevated px-1.5 py-0.5 transition-colors group-hover:border-primary/40">
              {cmd}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section id="terminal" ref={sectionRef} className="section-y relative">
      <div className="section-shell">
        <SectionHeading
          index="05"
          eyebrow="Interactive"
          title="Or just poke around the filesystem."
          description="A real shell over my actual content — cd, ls, cat, grep and tree all work. Tab completes, ↑ walks history. Try 'theme azure'."
        />

        <Reveal variant="scale" className="mt-12">
          {/* When fullscreen the window moves into a portal, so this keeps the
              section's height stable instead of collapsing the page. */}
          {fullscreen ? (
            <div className="h-[26rem] rounded-2xl border border-dashed border-border/60 sm:h-[30rem]" />
          ) : (
            terminal
          )}
        </Reveal>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {fullscreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
                className="fixed inset-0 z-[60] bg-background/80 p-0 backdrop-blur-sm sm:p-6"
              >
                <div className="mx-auto h-full max-w-6xl">{terminal}</div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
};

export default TerminalSection;
