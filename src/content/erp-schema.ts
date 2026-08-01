/**
 * Data model for the hospital ERP, as an inspectable schema.
 *
 * The three ERPs are internal systems with no public URL and no screenshots, so
 * there is nothing for a visitor to look at. This shows the *shape* of the
 * thing that was actually built — which for a business system is the schema,
 * not the interface.
 *
 * EVERY VALUE HERE IS INVENTED, exactly like content/erp-demo.ts. The table
 * and column structure is representative of the domain; the sample rows are
 * fabricated. Never put real client or patient data in this file.
 */

export type ColumnKind = 'pk' | 'fk' | 'plain';

export type SchemaColumn = {
  name: string;
  type: string;
  kind: ColumnKind;
  nullable?: boolean;
  /** `table.column` this points at, when kind is 'fk'. */
  references?: string;
  note?: string;
};

export type SchemaTable = {
  name: string;
  label: string;
  /** Which module of the ERP this belongs to — drives grouping and colour. */
  domain: 'patients' | 'scheduling' | 'inpatient' | 'billing' | 'staff';
  summary: string;
  columns: SchemaColumn[];
  /** Roughly how many rows this holds in practice. Illustrative. */
  scale: string;
};

export const erpSchema: SchemaTable[] = [
  {
    name: 'branches',
    label: 'Branches',
    domain: 'staff',
    summary:
      'The two sites. Almost every other table carries a branch_id — multi-branch was a requirement from day one, not a later bolt-on, which is why it sits in the schema rather than in application logic.',
    scale: '2 rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'name', type: 'text', kind: 'plain' },
      { name: 'has_inpatient', type: 'boolean', kind: 'plain', note: 'Only one branch runs beds' },
      { name: 'opens_at', type: 'time', kind: 'plain' },
      { name: 'closes_at', type: 'time', kind: 'plain' },
    ],
  },
  {
    name: 'patients',
    label: 'Patients',
    domain: 'patients',
    summary:
      'One record per person, shared across both branches. Deliberately not per-branch: the same patient consulting at one site and being admitted at the other must be one identity, or the clinical history fragments.',
    scale: '~8k rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'code', type: 'text', kind: 'plain', note: 'Human-facing, e.g. A-1042' },
      { name: 'full_name', type: 'text', kind: 'plain' },
      { name: 'phone', type: 'text', kind: 'plain' },
      { name: 'date_of_birth', type: 'date', kind: 'plain', nullable: true },
      { name: 'registered_branch_id', type: 'uuid', kind: 'fk', references: 'branches.id' },
      { name: 'created_at', type: 'timestamptz', kind: 'plain' },
    ],
  },
  {
    name: 'staff',
    label: 'Staff',
    domain: 'staff',
    summary:
      'Doctors, nurses and front desk. Consultants work across both branches on different days, so working hours live in a separate table rather than as columns here.',
    scale: '~40 rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'full_name', type: 'text', kind: 'plain' },
      { name: 'role', type: 'text', kind: 'plain', note: 'doctor | nurse | desk' },
      { name: 'speciality', type: 'text', kind: 'plain', nullable: true },
      { name: 'is_active', type: 'boolean', kind: 'plain' },
    ],
  },
  {
    name: 'staff_shifts',
    label: 'Staff shifts',
    domain: 'scheduling',
    summary:
      'When each person is available, per branch, per weekday. This is what makes double-booking detectable — without it the system can only say a slot is taken, not whether it was ever bookable.',
    scale: '~300 rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'staff_id', type: 'uuid', kind: 'fk', references: 'staff.id' },
      { name: 'branch_id', type: 'uuid', kind: 'fk', references: 'branches.id' },
      { name: 'weekday', type: 'smallint', kind: 'plain', note: '0 = Sunday' },
      { name: 'starts_at', type: 'time', kind: 'plain' },
      { name: 'ends_at', type: 'time', kind: 'plain' },
    ],
  },
  {
    name: 'rooms',
    label: 'Rooms',
    domain: 'scheduling',
    summary: 'Consult rooms and theatres. A booking occupies a room and a clinician at once, so both have to be checked for conflicts independently.',
    scale: '~14 rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'branch_id', type: 'uuid', kind: 'fk', references: 'branches.id' },
      { name: 'name', type: 'text', kind: 'plain' },
      { name: 'kind', type: 'text', kind: 'plain', note: 'consult | theatre | recovery' },
    ],
  },
  {
    name: 'appointments',
    label: 'Appointments',
    domain: 'scheduling',
    summary:
      'The busiest table. Holds an exclusion constraint on (staff_id, time range) and another on (room_id, time range) so the database itself refuses overlapping bookings — application-level checks lose that race under concurrent booking.',
    scale: '~120k rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'patient_id', type: 'uuid', kind: 'fk', references: 'patients.id' },
      { name: 'staff_id', type: 'uuid', kind: 'fk', references: 'staff.id' },
      { name: 'room_id', type: 'uuid', kind: 'fk', references: 'rooms.id', nullable: true },
      { name: 'branch_id', type: 'uuid', kind: 'fk', references: 'branches.id' },
      { name: 'slot', type: 'tstzrange', kind: 'plain', note: 'Half-open range — EXCLUDE USING gist' },
      { name: 'status', type: 'text', kind: 'plain', note: 'booked | seen | no_show | cancelled' },
    ],
  },
  {
    name: 'beds',
    label: 'Beds',
    domain: 'inpatient',
    summary: 'The ten-bed ward. Fixed inventory, so occupancy is a property of admissions rather than a mutable flag here — a status column on the bed would drift out of sync with reality.',
    scale: '10 rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'branch_id', type: 'uuid', kind: 'fk', references: 'branches.id' },
      { name: 'label', type: 'text', kind: 'plain', note: 'e.g. Bed 04' },
      { name: 'ward', type: 'text', kind: 'plain' },
    ],
  },
  {
    name: 'admissions',
    label: 'Admissions',
    domain: 'inpatient',
    summary:
      'Inpatient stays. discharged_at stays null while the patient is in, and the same exclusion-constraint trick stops one bed holding two people over overlapping dates.',
    scale: '~2k rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'patient_id', type: 'uuid', kind: 'fk', references: 'patients.id' },
      { name: 'bed_id', type: 'uuid', kind: 'fk', references: 'beds.id' },
      { name: 'admitted_at', type: 'timestamptz', kind: 'plain' },
      { name: 'discharged_at', type: 'timestamptz', kind: 'plain', nullable: true, note: 'NULL while occupied' },
      { name: 'admitting_staff_id', type: 'uuid', kind: 'fk', references: 'staff.id' },
    ],
  },
  {
    name: 'invoices',
    label: 'Invoices',
    domain: 'billing',
    summary:
      'One per encounter, raised from either an appointment or an admission — hence both foreign keys being nullable with a check that exactly one is set.',
    scale: '~110k rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'patient_id', type: 'uuid', kind: 'fk', references: 'patients.id' },
      { name: 'appointment_id', type: 'uuid', kind: 'fk', references: 'appointments.id', nullable: true },
      { name: 'admission_id', type: 'uuid', kind: 'fk', references: 'admissions.id', nullable: true },
      { name: 'total', type: 'numeric(12,2)', kind: 'plain' },
      { name: 'gst_rate', type: 'numeric(4,2)', kind: 'plain' },
      { name: 'status', type: 'text', kind: 'plain', note: 'draft | issued | paid' },
    ],
  },
  {
    name: 'invoice_lines',
    label: 'Invoice lines',
    domain: 'billing',
    summary: 'Line items. Prices are copied in at issue time rather than joined live — a later price change must never rewrite an invoice that has already gone out.',
    scale: '~400k rows',
    columns: [
      { name: 'id', type: 'uuid', kind: 'pk' },
      { name: 'invoice_id', type: 'uuid', kind: 'fk', references: 'invoices.id' },
      { name: 'description', type: 'text', kind: 'plain' },
      { name: 'quantity', type: 'integer', kind: 'plain' },
      { name: 'unit_price', type: 'numeric(12,2)', kind: 'plain', note: 'Snapshot, not a join' },
    ],
  },
];

export const DOMAIN_LABELS: Record<SchemaTable['domain'], string> = {
  patients: 'Patients',
  scheduling: 'Scheduling',
  inpatient: 'Inpatient',
  billing: 'Billing',
  staff: 'Staff & sites',
};

/** Every foreign key as a flat edge list — used to draw and highlight relationships. */
export const relationships = erpSchema.flatMap((t) =>
  t.columns
    .filter((c) => c.kind === 'fk' && c.references)
    .map((c) => ({
      from: t.name,
      fromColumn: c.name,
      to: c.references!.split('.')[0],
      toColumn: c.references!.split('.')[1],
    })),
);
