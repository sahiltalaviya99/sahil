import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarClock,
  Database,
  MousePointerClick,
  Network,
  Search,
  Route,
} from 'lucide-react';

import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui-kit/SectionHeading';

/**
 * The doorway to /lab.
 *
 * The terminal and the demos used to live inline here. Moving them to their own
 * route made the home page a portfolio again, but a page nobody knows about is
 * the same as no page — so this stays behind as an advert, not a placeholder.
 * It names what's through the door rather than saying "click here".
 */
const HIGHLIGHTS = [
  {
    icon: Route,
    title: 'A pathfinding arena',
    body: 'Draw a maze, then race BFS, Dijkstra and A* through it. Every run executes all three, so the table is a real comparison.',
  },
  {
    icon: Network,
    title: 'The ERP data model',
    body: 'The schema behind the hospital system, table by table, with every relationship traceable in both directions.',
  },
  {
    icon: CalendarClock,
    title: 'A conflict solver',
    body: 'Drag appointments around and watch double-booked clinicians, rooms and beds get caught as you do it.',
  },
  {
    icon: Database,
    title: 'A query engine',
    body: 'Real SQL — SELECT, WHERE, GROUP BY, ORDER BY — executed against this site’s own tables.',
  },
  {
    icon: Search,
    title: 'BM25 search',
    body: 'Ranked retrieval across the portfolio with the per-term scoring exposed. A ranking function, not a chatbot.',
  },
];

export const LabTeaser = () => (
  <section id="lab-teaser" className="section-y relative">
    <div className="section-shell">
      <SectionHeading
        index="06"
        eyebrow="The lab"
        title={
          <>
            Eighteen working things, <span className="text-primary">not screenshots.</span>
          </>
        }
        description="Claims are cheap on a portfolio. These are the things you can actually run — a schema, a query engine, a scheduler, a ranking function, a maze solver — each one reading this site's own content or pinned by its own tests, so none of it can drift from what I've said above."
      />

      <Stagger
        stagger={0.07}
        className="mt-10 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]"
      >
        {HIGHLIGHTS.map((h) => (
          <StaggerItem key={h.title} variant="fade-up">
            <div className="surface h-full p-5">
              <h.icon className="mb-3 h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold tracking-tight">{h.title}</h3>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed text-muted-foreground">
                {h.body}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal variant="fade-up" className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/lab" className="btn-primary">
            Open the lab
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          {/* Second door, same reason as the first: a page nobody knows about
              is the same as no page. */}
          <Link to="/motion" className="btn-ghost">
            <MousePointerClick className="h-4 w-4" />
            Motion — 25 interactions
          </Link>
        </div>
      </Reveal>
    </div>
  </section>
);
