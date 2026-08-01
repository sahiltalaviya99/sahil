import type { ResumeDoc } from '@/content/resume';
import { Classic, Compact, Sidebar } from '@/components/resume/templates';

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
  Component: (props: { doc: ResumeDoc }) => JSX.Element;
};

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
