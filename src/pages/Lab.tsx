import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarClock,
  Calculator,
  Database,
  FileSpreadsheet,
  Binary,
  Bomb,
  Cpu,
  Grid2x2,
  Hash,
  Hexagon,
  Regex,
  Grid3x3 as SudokuIcon,
  LayoutGrid,
  Network,
  Route,
  Search,
  Server,
  Workflow,
} from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { WorkflowPlayground } from '@/components/lab/WorkflowPlayground';
import { ApiConsole } from '@/components/lab/ApiConsole';
import { SqlConsole } from '@/components/lab/SqlConsole';
import { RoiCalculator } from '@/components/lab/RoiCalculator';
import { SchemaExplorer } from '@/components/lab/SchemaExplorer';
import { SchedulingBoard } from '@/components/lab/SchedulingBoard';
import { PortfolioSearch } from '@/components/lab/PortfolioSearch';
import { CsvToSql } from '@/components/lab/CsvToSql';
import { PathfindingArena } from '@/components/lab/PathfindingArena';
import { Minesweeper } from '@/components/lab/Minesweeper';
import { Game2048 } from '@/components/lab/Game2048';
import { TicTacToe } from '@/components/lab/TicTacToe';
import { Sudoku } from '@/components/lab/Sudoku';
import { SlidingPuzzle } from '@/components/lab/SlidingPuzzle';
import { Mastermind } from '@/components/lab/Mastermind';
import { RegexGolf } from '@/components/lab/RegexGolf';
import { GameOfLife } from '@/components/lab/GameOfLife';
import { AssemblyLab } from '@/components/lab/AssemblyLab';
import { site } from '@/content/site';
import { useScrollToElement } from '@/hooks/use-section-nav';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/motion';

/**
 * The interactive work, on its own route.
 *
 * These used to be two sections stapled to the bottom of the home page. Eight
 * exhibits plus a shell made that scroll interminable and buried the actual
 * work above them — and a tab row can't hold eight things legibly, least of all
 * at 360px. A dedicated page with a grouped index scales; a tab bar doesn't.
 *
 * The terminal used to sit above the switcher. It moved to the hero on the home
 * page and was removed from here rather than duplicated: two windows onto the
 * same shell, one of them the first thing a visitor sees, is one window too
 * many. `TerminalSection` still exists and still works — it is simply not
 * mounted anywhere at the moment.
 */

const EXHIBITS = [
  {
    id: 'schema',
    group: 'Data & systems',
    label: 'ERP schema explorer',
    icon: Network,
    blurb:
      "The hospital ERP's data model. Pick a table and every relationship it takes part in lights up in both directions.",
    render: () => <SchemaExplorer />,
  },
  {
    id: 'sql',
    group: 'Data & systems',
    label: 'SQL console',
    icon: Database,
    blurb: "Write real SQL against this site's own tables. SELECT, WHERE, GROUP BY, ORDER BY, LIMIT.",
    render: () => <SqlConsole />,
  },
  {
    id: 'api',
    group: 'Data & systems',
    label: 'API console',
    icon: Server,
    blurb: "Live endpoints over the same content the page renders — responses can't drift from the site.",
    render: () => <ApiConsole />,
  },
  {
    id: 'csv',
    group: 'Data & systems',
    label: 'CSV → schema',
    icon: FileSpreadsheet,
    blurb:
      'Drop in a spreadsheet and get an inferred PostgreSQL schema. The ERP onboarding job in miniature.',
    render: () => <CsvToSql />,
  },
  {
    id: 'pathfinding',
    group: 'Algorithms',
    label: 'Pathfinding arena',
    icon: Route,
    blurb:
      'Draw a maze, then race BFS, Dijkstra and A* through it. Every run executes all three, so the table is a real comparison.',
    render: () => <PathfindingArena />,
  },
  {
    id: 'scheduling',
    group: 'Algorithms',
    label: 'Scheduling conflicts',
    icon: CalendarClock,
    blurb:
      'Drag bookings and watch double-booked clinicians, rooms and beds get caught in real time.',
    render: () => <SchedulingBoard />,
  },
  {
    id: 'search',
    group: 'Algorithms',
    label: 'BM25 search',
    icon: Search,
    blurb: 'Ranked search over this site, with the per-term scoring exposed. A ranking function, not a chatbot.',
    render: () => <PortfolioSearch />,
  },
  {
    id: 'workflow',
    group: 'Automation',
    label: 'Workflow playground',
    icon: Workflow,
    blurb: 'Assemble a node chain, press Run, watch it execute step by step.',
    render: () => <WorkflowPlayground />,
  },
  {
    id: 'roi',
    group: 'Automation',
    label: 'Automation ROI',
    icon: Calculator,
    blurb: 'What automating a recurring task is actually worth, with the formula printed under the result.',
    render: () => <RoiCalculator />,
  },
  {
    id: 'minesweeper',
    group: 'For fun',
    label: 'Minesweeper',
    icon: Bomb,
    blurb:
      'The real thing — first-click safety, flood fill and chording. Three difficulties. Go on, you know how this works.',
    render: () => <Minesweeper />,
  },
  {
    id: '2048',
    group: 'For fun',
    label: '2048',
    icon: Grid2x2,
    blurb: 'Arrow keys, WASD, or swipe. One undo, in case of misfire.',
    render: () => <Game2048 />,
  },
  {
    id: 'tictactoe',
    group: 'For fun',
    label: 'Tic-tac-toe',
    icon: Hash,
    blurb:
      'Against a solved minimax opponent, or against a friend on the same screen. On hard it cannot be beaten — the tests play every reachable game to prove it.',
    render: () => <TicTacToe />,
  },
  {
    id: 'sudoku',
    group: 'Mind games',
    label: 'Sudoku',
    icon: SudokuIcon,
    blurb:
      'Generated fresh every time, with a guaranteed unique solution — clues are only removed while exactly one solution survives.',
    render: () => <Sudoku />,
  },
  {
    id: 'sliding',
    group: 'Mind games',
    label: 'Sliding puzzle',
    icon: LayoutGrid,
    blurb:
      'The 15-puzzle. Half of all arrangements can never be solved — every shuffle here is checked for parity first.',
    render: () => <SlidingPuzzle />,
  },
  {
    id: 'mastermind',
    group: 'Mind games',
    label: 'Mastermind',
    icon: Binary,
    blurb:
      'Break the code by deduction, and watch the number of possible codes collapse with every guess.',
    render: () => <Mastermind />,
  },
  {
    id: 'asm',
    group: 'Curiosities',
    label: 'Assembly lab',
    icon: Cpu,
    blurb:
      'Eight instructions, four registers, a real assembler and virtual machine. Write a program that prints the target.',
    render: () => <AssemblyLab />,
  },
  {
    id: 'regex',
    group: 'Curiosities',
    label: 'Regex golf',
    icon: Regex,
    blurb:
      'Match every string on the left, reject every one on the right, in as few characters as you can.',
    render: () => <RegexGolf />,
  },
  {
    id: 'life',
    group: 'Curiosities',
    label: 'Game of Life',
    icon: Hexagon,
    blurb:
      'Four rules, no player, and structure nobody designed. Draw cells or stamp a glider gun.',
    render: () => <GameOfLife />,
  },
] as const;

type ExhibitId = (typeof EXHIBITS)[number]['id'];

const GROUPS = [...new Set(EXHIBITS.map((e) => e.group))];

const LabPage = () => {
  const [active, setActive] = useState<ExhibitId>('schema');
  const exhibit = EXHIBITS.find((e) => e.id === active)!;

  const sectionRef = useRef<HTMLElement>(null);
  const scrollToElement = useScrollToElement();

  /**
   * Picking an exhibit also re-anchors the page to the top of the switcher.
   *
   * Without it, switching from a tall exhibit (the schema explorer) to a short
   * one (the ROI calculator) shrinks the document under you, the browser clamps
   * the scroll position to the new maximum, and you land at the footer looking
   * at the thing you just left the page for.
   */
  const choose = (id: ExhibitId) => {
    setActive(id);
    scrollToElement(sectionRef.current);
  };

  useEffect(() => {
    document.title = `Lab — ${site.name}`;
    return () => {
      document.title = `${site.name} — ${site.role}`;
    };
  }, []);

  /* No scroll-to-top here. It lived in this effect and could not run until the
     lazy chunk arrived — until then the route showed a Suspense fallback, the
     document collapsed to fallback + footer, and the browser clamped you to the
     bottom of it. SiteChrome now resets on the pathname change instead. */

  return (
    <>
      <main className="pt-[calc(var(--nav-h)+3rem)]">
        {/* ---------------- Header ---------------- */}
        <header className="section-shell">
          <Reveal variant="fade-up">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to the portfolio
            </Link>

            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,6vw,3.75rem)] font-bold leading-[1.03] tracking-tight">
              Don&apos;t take my word for it — <span className="text-primary">run it.</span>
            </h1>

            <p className="lead mt-5 max-w-2xl">
              Eighteen working things, not screenshots: a query engine, a schema, a conflict
              solver, a ranking function, a maze solver, an assembler — and a handful of games,
              because you should be allowed to enjoy yourself. The tools read this site&apos;s
              own content, so nothing here can drift from what the portfolio claims; everything
              else has its rules pinned by tests.
            </p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Looking for the shell? It&apos;s on the{' '}
              <Link to="/" className="text-primary underline-offset-4 hover:underline">
                front page
              </Link>
              , in the hero.
            </p>
          </Reveal>
        </header>

        {/* ---------------- Exhibits ---------------- */}
        {/* Same reason as /motion: without the top margin the sticky sidebar's
            first item butts straight into the last line of the header copy and
            the two read as one collided block at lg. The terminal used to sit
            between them and provided the gap for free. */}
        <section
          id="exhibits"
          ref={sectionRef}
          className="section-shell mt-12 pb-24 sm:mt-16 sm:pb-32"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10">
            {/* Index. Sticky on desktop, a scrolling chip row on mobile. */}
            <nav aria-label="Exhibits" className="min-w-0">
              <div className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
                {/* Mobile */}
                <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:hidden">
                  {EXHIBITS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => choose(e.id)}
                      className={cn(
                        'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                        active === e.id
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      <e.icon className="h-3.5 w-3.5 shrink-0" />
                      {e.label}
                    </button>
                  ))}
                </div>

                {/* Desktop */}
                <div className="hidden lg:block">
                  {GROUPS.map((group) => (
                    <div key={group} className="mb-5 last:mb-0">
                      <p className="mb-2 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-muted-foreground/50">
                        {group}
                      </p>
                      <ul className="space-y-0.5">
                        {EXHIBITS.filter((e) => e.group === group).map((e) => (
                          <li key={e.id}>
                            <button
                              onClick={() => choose(e.id)}
                              aria-current={active === e.id ? 'true' : undefined}
                              className={cn(
                                'relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                active === e.id
                                  ? 'text-primary'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {active === e.id && (
                                <motion.span
                                  layoutId="exhibit-pill"
                                  className="absolute inset-0 rounded-lg border border-primary/25 bg-primary/10"
                                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                />
                              )}
                              <e.icon className="relative h-4 w-4 shrink-0" />
                              <span className="relative min-w-0 truncate">{e.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </nav>

            {/* Panel. The min-height stops a short exhibit collapsing the
                document height on switch — belt and braces with the re-anchor
                above, since the browser clamps scrollTop before we can scroll. */}
            <div className="min-h-[34rem] min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: easeOutExpo }}
                >
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    {exhibit.label}
                  </h2>
                  <p className="mb-5 mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {exhibit.blurb}
                  </p>
                  {exhibit.render()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default LabPage;
