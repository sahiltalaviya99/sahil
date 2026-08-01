/**
 * The automation suite, by department.
 *
 * It lives here rather than as a number typed into `stats`, a sentence in
 * `projects.ts` and a figure in the README banner, because that is exactly how
 * the site came to claim **7** long after the real figure had passed fifty.
 *
 * **`automationCount` is stated, not derived.** The register I was shown listed
 * 89 rows; Sahil's own figure is 60, and his count is the one that goes on the
 * page. Per-department counts are therefore *not* recorded — publishing a
 * breakdown that summed to something other than the headline would be an
 * inconsistency a reader could spot, and the conservative number is the one
 * worth defending in an interview.
 *
 * Workflow names are not stored either. Several are truncated in the source
 * register, and inventing the missing halves would break the rule this repo runs
 * on. Paste the full list as text and the names can be added here.
 *
 * HR is called out because that whole department's set is Sahil's own work.
 */

export type AutomationGroup = {
  department: string;
  /** What the department's agents actually do — no invented specifics. */
  blurb: string;
};

export const automationGroups: AutomationGroup[] = [
  {
    department: 'HR',
    blurb:
      'Hiring end to end — job posting, résumé screening, interview scheduling and scoring, offer and exit documents, onboarding, probation reminders, payroll and timesheet reporting.',
  },
  {
    department: 'Sales',
    blurb:
      'Lead scoring, enrichment and qualification (including voice agents), CRM sync between HubSpot, Brevo, Calendly and Cal, plus daily pipeline and follow-up reporting.',
  },
  {
    department: 'Marketing',
    blurb:
      'Content generation and repurposing across seven brand properties, LinkedIn and newsletter publishing, AI video and avatar production, and scheduled distribution.',
  },
  {
    department: 'Development',
    blurb:
      'PR summaries, standup digests, release notes, CI/CD failure triage, log anomaly detection, SSL expiry and secrets scanning, Dockerfile and Nginx config generation.',
  },
  {
    department: 'Project management',
    blurb:
      'Timesheet compliance, kick-off and handover checklists, weekly task hours, overdue notifications, change requests, and a live project dashboard.',
  },
  {
    department: 'QA',
    blurb:
      'Test case and regression checklist generation, basic web testing, and defect notification routing.',
  },
  {
    department: 'Design',
    blurb: 'Social creative generation, design review checks, and Figma-to-design handoff.',
  },
];

/** Sahil's own count. One place to change it; every figure on the site follows. */
export const automationCount = 60;

export const automationDepartmentCount = automationGroups.length;
