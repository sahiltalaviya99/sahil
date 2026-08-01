import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, RotateCcw, Wand2 } from 'lucide-react';

import {
  DAY_END,
  DAY_START,
  INITIAL_BOOKINGS,
  RESOURCES,
  conflictedBookingIds,
  detectConflicts,
  findNextFreeSlot,
  minutesToLabel,
  type Booking,
} from '@/lib/scheduling';
import { cn } from '@/lib/utils';

/**
 * The scheduling problem that actually makes a hospital ERP hard.
 *
 * Booking a slot is trivial. Guaranteeing no clinician is in two places at
 * once, no room is double-used and no bed holds two patients over overlapping
 * dates is the part that has to be right every time — so that's what this
 * exposes. Drag a booking, watch conflicts appear and resolve live.
 *
 * All the rules live in lib/scheduling.ts as pure functions over plain data,
 * tested directly rather than through this UI. Every name here is invented.
 */

const SNAP = 15; // minutes
const TOTAL = DAY_END - DAY_START;

const RESOURCE_TONE: Record<string, string> = {
  doctor: 'text-primary',
  room: 'text-signal',
  bed: 'text-foreground',
};

export const SchedulingBoard = () => {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [dragging, setDragging] = useState<string | null>(null);

  const conflicts = useMemo(() => detectConflicts(bookings, RESOURCES), [bookings]);
  const badIds = useMemo(() => conflictedBookingIds(conflicts), [conflicts]);

  const move = (id: string, deltaMinutes: number) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const span = b.end - b.start;
        // Snap, then clamp to the visible day so a booking can't be dragged
        // off the board and become unreachable.
        const raw = Math.round((b.start + deltaMinutes) / SNAP) * SNAP;
        const start = Math.max(DAY_START, Math.min(DAY_END - span, raw));
        return { ...b, start, end: start + span };
      }),
    );
  };

  const autoResolve = () => {
    setBookings((prev) => {
      let next = [...prev];
      // Re-detect after each move: fixing one clash can create another, and
      // resolving against a stale conflict list just shuffles the problem.
      for (const id of conflictedBookingIds(detectConflicts(next, RESOURCES))) {
        const booking = next.find((b) => b.id === id);
        if (!booking) continue;
        const slot = findNextFreeSlot(booking, next, RESOURCES, DAY_START);
        if (slot === null) continue;
        const span = booking.end - booking.start;
        next = next.map((b) => (b.id === id ? { ...b, start: slot, end: slot + span } : b));
      }
      return next;
    });
  };

  const addClash = () => {
    const n = bookings.length + 1;
    setBookings((prev) => [
      ...prev,
      {
        id: `new-${n}`,
        label: `Consultation — Patient A-1${200 + n}`,
        resourceIds: ['dr-mehta', 'consult-a'],
        start: 9 * 60 + 45,
        end: 10 * 60 + 15,
      },
    ]);
  };

  const hours = [];
  for (let m = DAY_START; m <= DAY_END; m += 60) hours.push(m);

  return (
    <div className="surface overflow-hidden">
      {/* Status bar — the whole point of the exhibit. */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 transition-colors',
          conflicts.length
            ? 'border-destructive/40 bg-destructive/[0.07]'
            : 'border-border/70 bg-primary/[0.06]',
        )}
      >
        <p className="flex items-center gap-2 font-mono text-xs">
          {conflicts.length ? (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
              <span className="text-destructive">
                {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-primary">Schedule is clean</span>
            </>
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          <button onClick={addClash} className="btn-ghost px-3 py-1.5 text-xs">
            <Plus className="h-3 w-3" />
            Add booking
          </button>
          <button
            onClick={autoResolve}
            disabled={!conflicts.length}
            className="btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Wand2 className="h-3 w-3" />
            Auto-resolve
          </button>
          <button
            onClick={() => setBookings(INITIAL_BOOKINGS)}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Timeline. Scrolls inside its own pane on narrow screens. */}
      <div className="overflow-x-auto p-4">
        <div className="min-w-[44rem]">
          {/* Hour ruler */}
          <div className="relative mb-2 h-5 border-b border-border">
            {hours.map((m) => (
              <span
                key={m}
                className="absolute -translate-x-1/2 font-mono text-[0.58rem] text-muted-foreground/60"
                style={{ left: `${((m - DAY_START) / TOTAL) * 100}%` }}
              >
                {minutesToLabel(m)}
              </span>
            ))}
          </div>

          {RESOURCES.map((r) => {
            const lane = bookings.filter((b) => b.resourceIds.includes(r.id));
            return (
              <div key={r.id} className="mb-1.5 flex items-center gap-3">
                <span
                  className={cn(
                    'w-24 shrink-0 truncate font-mono text-[0.66rem]',
                    RESOURCE_TONE[r.kind],
                  )}
                  title={`${r.name} · ${r.kind}`}
                >
                  {r.name}
                </span>

                <div className="relative h-9 flex-1 rounded-lg bg-elevated/50">
                  {/* Outside working hours, shaded so "why is that flagged?" is visible */}
                  {r.opens > DAY_START && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-lg bg-background/60"
                      style={{ width: `${((r.opens - DAY_START) / TOTAL) * 100}%` }}
                    />
                  )}
                  {r.closes < DAY_END && (
                    <div
                      className="absolute inset-y-0 right-0 rounded-r-lg bg-background/60"
                      style={{ width: `${((DAY_END - r.closes) / TOTAL) * 100}%` }}
                    />
                  )}

                  {lane.map((b) => {
                    const bad = badIds.has(b.id);
                    return (
                      <button
                        key={b.id}
                        title={`${b.label} · ${minutesToLabel(b.start)}–${minutesToLabel(b.end)}`}
                        onPointerDown={(e) => {
                          e.currentTarget.setPointerCapture(e.pointerId);
                          setDragging(b.id);
                        }}
                        onPointerMove={(e) => {
                          if (dragging !== b.id) return;
                          const lanePx = e.currentTarget.parentElement?.clientWidth ?? 1;
                          move(b.id, (e.movementX / lanePx) * TOTAL);
                        }}
                        onPointerUp={(e) => {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                          setDragging(null);
                        }}
                        // Keyboard equivalent — dragging can't be the only way to move one.
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            move(b.id, -SNAP);
                          }
                          if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            move(b.id, SNAP);
                          }
                        }}
                        className={cn(
                          'absolute inset-y-1 touch-none overflow-hidden rounded-md border px-2 text-left font-mono text-[0.6rem] leading-tight transition-colors',
                          dragging === b.id ? 'cursor-grabbing' : 'cursor-grab',
                          bad
                            ? 'border-destructive/60 bg-destructive/25 text-destructive-foreground'
                            : 'border-primary/40 bg-primary/20 text-foreground',
                        )}
                        style={{
                          left: `${((b.start - DAY_START) / TOTAL) * 100}%`,
                          width: `${((b.end - b.start) / TOTAL) * 100}%`,
                        }}
                      >
                        <span className="block truncate">{minutesToLabel(b.start)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict detail */}
      {conflicts.length > 0 && (
        <ul className="space-y-1 border-t border-border/70 bg-background/40 px-4 py-3 font-mono text-[0.66rem]">
          {conflicts.map((c, i) => {
            const name = (id: string) => bookings.find((b) => b.id === id)?.label ?? id;
            const res = RESOURCES.find((r) => r.id === ('resourceId' in c ? c.resourceId : ''))?.name;
            return (
              <li key={i} className="text-destructive">
                {c.type === 'overlap' && (
                  <>
                    {res}: “{name(c.a)}” overlaps “{name(c.b)}” by {c.minutes} min
                  </>
                )}
                {c.type === 'outside-hours' && (
                  <>
                    {res}: “{name(c.a)}” falls outside working hours
                  </>
                )}
                {c.type === 'invalid' && (
                  <>
                    “{name(c.a)}” is invalid — {c.reason}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="border-t border-border/60 px-4 py-3 text-[0.7rem] leading-relaxed text-muted-foreground/60">
        Drag a booking, or focus one and use ← →. Overlap uses half-open intervals, so
        back-to-back appointments at 10:00–11:00 and 11:00–12:00 don&apos;t clash — closed
        intervals report a phantom conflict at exactly 11:00. Sample data throughout.
      </p>
    </div>
  );
};
