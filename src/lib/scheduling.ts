/**
 * Appointment / bed scheduling with real conflict detection.
 *
 * This is the problem that actually makes a hospital ERP hard. Booking a slot
 * is trivial; guaranteeing that no doctor is in two places at once, no room is
 * double-used, and no bed is assigned to two patients on overlapping dates is
 * the part that has to be right every single time.
 *
 * Kept as pure functions over plain data so the rules can be tested directly
 * rather than through a UI. Times are minutes-from-midnight integers — the one
 * decision that removes most date-arithmetic bugs from this kind of code.
 */

export type ResourceKind = 'doctor' | 'room' | 'bed';

export type Resource = {
  id: string;
  name: string;
  kind: ResourceKind;
  /** Working window, minutes from midnight. Beds are 24h. */
  opens: number;
  closes: number;
};

export type Booking = {
  id: string;
  label: string;
  /** Every resource this booking occupies at once. */
  resourceIds: string[];
  /** Minutes from midnight. `end` is exclusive. */
  start: number;
  end: number;
};

export type Conflict =
  | { type: 'overlap'; a: string; b: string; resourceId: string; minutes: number }
  | { type: 'outside-hours'; a: string; resourceId: string }
  | { type: 'invalid'; a: string; reason: string };

export const minutesToLabel = (m: number) => {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

/**
 * Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd).
 *
 * Half-open is the whole trick. With closed intervals a 10:00–11:00 booking
 * and an 11:00–12:00 booking "overlap" at exactly 11:00, and you spend a week
 * fielding complaints about phantom clashes on back-to-back appointments.
 */
export const overlapMinutes = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): number => Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));

export const detectConflicts = (bookings: Booking[], resources: Resource[]): Conflict[] => {
  const conflicts: Conflict[] = [];
  const byId = new Map(resources.map((r) => [r.id, r]));

  for (const b of bookings) {
    if (b.end <= b.start) {
      conflicts.push({ type: 'invalid', a: b.id, reason: 'ends before it starts' });
    }
    if (!b.resourceIds.length) {
      conflicts.push({ type: 'invalid', a: b.id, reason: 'no resource assigned' });
    }
    for (const rid of b.resourceIds) {
      const r = byId.get(rid);
      if (!r) continue;
      if (b.start < r.opens || b.end > r.closes) {
        conflicts.push({ type: 'outside-hours', a: b.id, resourceId: rid });
      }
    }
  }

  // Group by resource, then sweep. Only bookings sharing a resource can clash,
  // so this never compares the whole set against itself.
  const byResource = new Map<string, Booking[]>();
  for (const b of bookings) {
    for (const rid of b.resourceIds) {
      const list = byResource.get(rid);
      if (list) list.push(b);
      else byResource.set(rid, [b]);
    }
  }

  for (const [resourceId, list] of byResource) {
    const sorted = [...list].sort((x, y) => x.start - y.start);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        // Sorted by start, so once one starts at/after i's end, so does
        // everything after it — stop rather than scanning the rest.
        if (sorted[j].start >= sorted[i].end) break;
        const minutes = overlapMinutes(
          sorted[i].start,
          sorted[i].end,
          sorted[j].start,
          sorted[j].end,
        );
        if (minutes > 0) {
          conflicts.push({ type: 'overlap', a: sorted[i].id, b: sorted[j].id, resourceId, minutes });
        }
      }
    }
  }

  return conflicts;
};

/** Ids of every booking involved in at least one conflict. */
export const conflictedBookingIds = (conflicts: Conflict[]): Set<string> => {
  const ids = new Set<string>();
  for (const c of conflicts) {
    ids.add(c.a);
    if (c.type === 'overlap') ids.add(c.b);
  }
  return ids;
};

/**
 * Earliest start ≥ `from` where `booking` fits all its resources cleanly.
 * Returns null if the day can't accommodate it — which is a real answer, not a
 * failure, and the UI should say so rather than silently doing nothing.
 */
export const findNextFreeSlot = (
  booking: Booking,
  bookings: Booking[],
  resources: Resource[],
  from = 0,
  step = 15,
): number | null => {
  const duration = booking.end - booking.start;
  const others = bookings.filter((b) => b.id !== booking.id);
  const mine = booking.resourceIds
    .map((id) => resources.find((r) => r.id === id))
    .filter((r): r is Resource => !!r);
  if (!mine.length || duration <= 0) return null;

  const earliest = Math.max(from, ...mine.map((r) => r.opens));
  const latest = Math.min(...mine.map((r) => r.closes));

  for (let start = earliest; start + duration <= latest; start += step) {
    const end = start + duration;
    const clash = others.some(
      (o) =>
        o.resourceIds.some((rid) => booking.resourceIds.includes(rid)) &&
        overlapMinutes(start, end, o.start, o.end) > 0,
    );
    if (!clash) return start;
  }
  return null;
};

/* ------------------------------------------------------------------ */
/*  Sample day                                                         */
/*                                                                     */
/*  Every value here is invented, same rule as content/erp-demo.ts.     */
/*  Never put real patient data in this file.                          */
/* ------------------------------------------------------------------ */

export const DAY_START = 8 * 60;
export const DAY_END = 20 * 60;

export const RESOURCES: Resource[] = [
  { id: 'dr-mehta', name: 'Dr. Mehta', kind: 'doctor', opens: 9 * 60, closes: 17 * 60 },
  { id: 'dr-rao', name: 'Dr. Rao', kind: 'doctor', opens: 10 * 60, closes: 18 * 60 },
  { id: 'ot-1', name: 'Theatre 1', kind: 'room', opens: 8 * 60, closes: 20 * 60 },
  { id: 'consult-a', name: 'Consult A', kind: 'room', opens: 9 * 60, closes: 18 * 60 },
  { id: 'bed-04', name: 'Bed 04', kind: 'bed', opens: 0, closes: 24 * 60 },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    label: 'Consultation — Patient A-1042',
    resourceIds: ['dr-mehta', 'consult-a'],
    start: 9 * 60 + 30,
    end: 10 * 60,
  },
  {
    id: 'b2',
    label: 'Follow-up — Patient A-1108',
    resourceIds: ['dr-mehta', 'consult-a'],
    start: 10 * 60,
    end: 10 * 60 + 30,
  },
  {
    id: 'b3',
    label: 'Procedure — Patient A-1042',
    resourceIds: ['dr-rao', 'ot-1'],
    start: 11 * 60,
    end: 12 * 60 + 30,
  },
  {
    id: 'b4',
    label: 'Admission — Patient A-1201',
    resourceIds: ['bed-04'],
    start: 13 * 60,
    end: 18 * 60,
  },
];
