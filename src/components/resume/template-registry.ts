import { Classic, Compact, Sidebar, type TemplateProps } from '@/components/resume/templates';

/**
 * The template registry.
 *
 * Kept in a `.ts` holding component *references* rather than inside
 * templates.tsx: a `.tsx` that exports constants next to its components trips
 * `react-refresh/only-export-components` once per component. Same arrangement as
 * `motion-lab/registry.ts`, for the same reason.
 */

export type TemplateId = 'classic' | 'compact' | 'sidebar';

export type Template = {
  id: TemplateId;
  label: string;
  /** Shown under the picker — say what it is *for*, not what it looks like. */
  note: string;
  Component: (props: TemplateProps) => JSX.Element;
};

/**
 * Accent swatches.
 *
 * **`null` is first and is the default: black and white.** A résumé is read by
 * strangers on unknown printers and forwarded as often as it is opened, and mono
 * is the version that survives all of that — colour is the option, not the
 * baseline. Every value below is dark enough to hold contrast on white and to
 * stay legible when a greyscale printer flattens it.
 */
export type AccentOption = { id: string; label: string; value: string | null };

export const accents: AccentOption[] = [
  { id: 'mono', label: 'Black & white', value: null },
  // The site's emerald is #34D399 — a highlighter on paper. Same hue, 34% light.
  { id: 'emerald', label: 'Emerald', value: '#1c8a63' },
  { id: 'blue', label: 'Blue', value: '#1d5fb0' },
  { id: 'navy', label: 'Navy', value: '#26405f' },
  { id: 'plum', label: 'Plum', value: '#8a1c4f' },
  { id: 'rust', label: 'Rust', value: '#a2542a' },
];

export const accentById = (id: string): AccentOption =>
  accents.find((a) => a.id === id) ?? accents[0];

export const templates: Template[] = [
  {
    id: 'classic',
    label: 'Classic',
    note: 'Single column, generous spacing. Parses cleanly in every applicant-tracking system — send this one unless you have a reason not to.',
    Component: Classic,
  },
  {
    id: 'compact',
    label: 'Compact',
    note: 'The same layout set about 10% tighter. Use it when the content is spilling a few lines onto a second page and you would rather it did not.',
    Component: Compact,
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    note: 'Contact, skills and education move to a left rail. Reads as designed rather than typed — but multi-column layouts are the ones ATS parsers most often scramble, so prefer it for a human recipient.',
    Component: Sidebar,
  },
];

export const templateById = (id: TemplateId): Template =>
  templates.find((t) => t.id === id) ?? templates[0];
