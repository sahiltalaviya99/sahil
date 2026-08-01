/**
 * Work data. The three ERP systems lead; everything else sits behind the
 * "view all" toggle in ProjectsSection.
 *
 * DELIBERATE: the ERP systems are internal business software and are not
 * publicly reachable, so they carry no `demo` link and are marked
 * `status: 'internal'`. Client company names are stated, but their marketing
 * sites are NOT linked — a link there would imply you can go and see the ERP,
 * which you can't.
 *
 * NOTE ON IMAGES: `cover` is optional — when absent the card renders a
 * generated monogram panel. Drop real screenshots into `public/work/` and set
 * `cover: '/work/<file>.png'` to upgrade a card. (The previous version used
 * unrelated Unsplash stock photos on client work; those are gone.)
 */

import {
  automationCount,
  automationDepartmentCount,
  automationGroups,
} from '@/content/automations';

export type Project = {
  id: string;
  title: string;
  /** Client or company the work was for. Named, not linked. */
  client?: string;
  /** One line. Shown on the card. Lead with what it does, not the stack. */
  summary: string;
  /** Full prose. Shown in the dialog. */
  detail: string;
  /** What Sahil actually did on it. */
  role: string;
  year: string;
  /** Concrete result — the line that does the persuading. */
  outcome: string;
  tags: string[];
  /** Live URL, if the work is publicly reachable. ERPs have none. */
  demo?: string;
  cover?: string;
  featured?: boolean;
  kind: 'erp' | 'product' | 'automation' | 'qa';
  status: 'live' | 'internal' | 'in-development';
};

export const projects: Project[] = [
  /* ---------------------------------------------------------------------- */
  /*  ERP systems — the headline work                                        */
  /* ---------------------------------------------------------------------- */
  {
    id: 'adorn-hospital-erp',
    title: 'Adorn — Hospital Management ERP',
    client: 'Adorn Clinic, Ahmedabad',
    summary:
      'Two-branch hospital ERP covering appointments, patient records, inpatient beds and clinical support end to end.',
    detail:
      'A complete hospital management system for a multi-speciality aesthetic healthcare group running plastic surgery, dermatology, hair restoration and cosmetic dentistry. It spans two branches, one of which operates a ten-bed inpatient ward with clinical support, so the system has to handle both walk-in consultation flow and admitted-patient care in the same data model. Appointment booking, patient records, branch-level operations and clinical workflows are all covered. I built it across the whole stack — PostgreSQL schema, Node API, Next.js and React interface — and covered the critical booking and admission paths with Playwright end-to-end tests.',
    role: 'Full stack — schema, API, interface, E2E tests, deployment',
    year: '2026',
    outcome:
      'Single system covering two branches, outpatient appointments and a ten-bed inpatient ward.',
    tags: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Playwright', 'Healthcare'],
    featured: true,
    kind: 'erp',
    status: 'in-development',
  },
  {
    id: 'sahaj-cooling-erp',
    title: 'Sahaj Cooling & Electronics ERP',
    client: 'Sahaj Cooling, Ahmedabad',
    summary:
      'Full-surface ERP for an HVAC and refrigeration firm — every operational module, built on .NET.',
    detail:
      'An enterprise ERP for an HVAC, refrigeration and electronics business that has been designing and servicing cooling systems since 1969, working with manufacturers like Daikin, Carrier, Mitsubishi and LG across hospitals, automotive, retail and real estate. The brief was full coverage rather than a single department: the system carries the complete operational surface the business runs on. Built on a .NET backend against PostgreSQL with a React interface, and covered by Playwright end-to-end tests across the core flows.',
    role: 'Full stack — .NET services, data layer, React interface, E2E tests',
    year: '2026',
    outcome: 'Complete operational ERP replacing fragmented departmental tooling.',
    tags: ['.NET', 'React', 'PostgreSQL', 'Playwright', 'HVAC', 'Enterprise'],
    featured: true,
    kind: 'erp',
    status: 'in-development',
  },
  {
    id: 'awax-manufacturing-erp',
    title: 'Awax Studio — Manufacturing ERP',
    client: 'Awax Studio',
    summary:
      'Manufacturing ERP for a candle producer running retail, wholesale and custom production in parallel.',
    detail:
      'A manufacturing ERP for a scented-candle maker operating three channels at once: direct retail, bulk wholesale, and bespoke custom production for corporate clients. Each channel behaves differently — retail is order-driven, wholesale is batch-driven, custom is quote-driven — so the system models production, inventory and order flow in a way that holds for all three rather than forcing one shape onto the others. Built on Next.js, Node and PostgreSQL, with Playwright end-to-end coverage on the production and order paths.',
    role: 'Full stack — schema, API, interface, E2E tests, deployment',
    year: '2026',
    outcome: 'Retail, wholesale and custom manufacturing running through one system.',
    tags: ['Next.js', 'Node.js', 'PostgreSQL', 'Playwright', 'Manufacturing'],
    featured: true,
    kind: 'erp',
    status: 'in-development',
  },

  /* ---------------------------------------------------------------------- */
  /*  Client platforms                                                       */
  /* ---------------------------------------------------------------------- */
  {
    id: 'evolved-human-care',
    title: 'Evolved Human Care',
    summary:
      'Doctor–patient consultation and appointment booking platform, rebuilt from Figma with live data throughout.',
    detail:
      'A telehealth product for booking and running online doctor consultations. I rebuilt the interface against new Figma designs to bring consistency across the flows, and worked both sides of the wire — the API endpoints serving consultation and appointment data as well as the client consuming them, plus the webhooks and real-time notifications that keep appointment state live for doctor and patient simultaneously. Finished with a performance pass on load time and interaction responsiveness.',
    role: 'Full stack — interface rebuild, API endpoints, real-time integration',
    year: '2025',
    outcome: 'Shipped to production and serving live consultations.',
    tags: ['React', 'REST API', 'Webhooks', 'Real-time', 'Healthcare'],
    demo: 'https://evolvedhumancare.io',
    kind: 'product',
    status: 'live',
  },
  {
    id: 'inboxplus',
    title: 'InboxPlus',
    summary:
      'Email automation platform with a drag-and-drop workflow builder — an n8n-style canvas with dynamic nodes.',
    detail:
      'A platform for building email automation visually. I built the drag-and-drop workflow canvas with dynamic node behaviour, working across the client and the API that persists and executes those workflows. Much of the effort went into the parts users feel: cutting redundant API calls that were firing on every canvas interaction, and reworking rendering so dragging a node on a large workflow stayed smooth.',
    role: 'Full stack — workflow builder, API layer, performance',
    year: '2025',
    outcome: 'Measurably lower UI latency on large workflows; fewer redundant API calls.',
    tags: ['React', 'Drag & Drop', 'Workflow Builder', 'Performance'],
    demo: 'https://inboxpl.us',
    kind: 'product',
    status: 'live',
  },
  {
    id: 'wellnessta',
    title: 'Wellnessta',
    summary:
      'Spa and salon booking platform — stabilised, made searchable, and made pleasant to book on.',
    detail:
      'I came onto an existing booking platform with stability problems and worked it end to end. Three strands: tracking down and fixing the crash-causing bugs across client and server, replacing the naive search with a debounced implementation and a tighter query behind it so it stopped hammering the API on every keystroke, and reworking the booking flow itself so it was clearer to complete.',
    role: 'Full stack — stability, search and query optimisation, booking flow',
    year: '2025',
    outcome: 'Reduced crash rate and cut search API traffic substantially.',
    tags: ['React', 'Debounced Search', 'Performance', 'Booking'],
    demo: 'https://wellnessta.com',
    kind: 'product',
    status: 'live',
  },
  {
    id: 'shreenathji-tech',
    title: 'Shreenathji Tech Showcase',
    summary:
      'A responsive marketing showcase built on reusable components and tuned for fast loads.',
    detail:
      'Designed and built a showcase site with an emphasis on clean layout, smooth interaction and genuine cross-device behaviour. Built out of reusable components so the site could grow without the CSS turning into a liability, and optimised so it loads quickly on mobile connections.',
    role: 'Design and frontend development',
    year: '2024',
    outcome: 'Fast, fully responsive site running in production.',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'Responsive', 'UI/UX'],
    demo: 'https://shreenathji-tech-showcase.pages.dev/',
    kind: 'product',
    status: 'live',
  },

  /* ---------------------------------------------------------------------- */
  /*  AI automation                                                          */
  /* ---------------------------------------------------------------------- */
  {
    id: 'automation-suite',
    title: 'Company-Wide AI Automation Suite',
    summary: `${automationCount}+ n8n agents across ${automationDepartmentCount} departments — an operational backbone, not a set of scripts.`,
    detail: `Not one tool but the automation layer a company runs on: ${automationCount}+ workflows spanning ${automationGroups
      .map((g) => g.department)
      .join(', ')}. Each replaces a recurring manual task outright rather than making it slightly faster — hiring from job post through to offer letter, lead qualification including voice agents, content generation across seven brand properties, CI/CD triage, and the reporting that used to be somebody's Monday morning. The HR set is entirely my own design and build.`,
    role: 'Automation design and implementation, end to end',
    year: '2025',
    outcome: `${automationCount}+ workflows in production; entire categories of recurring manual work removed rather than reduced.`,
    tags: ['n8n', 'Workflow Automation', 'AI Agents', 'HR', 'Sales', 'Marketing'],
    kind: 'automation',
    status: 'internal',
  },
  {
    id: 'poc-image-generator',
    title: 'POC Image Generator',
    summary:
      'Turns a row in a Google Sheet into a finished proof-of-concept slide, automatically.',
    detail:
      'Sales needed POC visuals faster than design could produce them. This agent reads a heading and description straight from a Google Sheet, fills a Google Slides template, renders the slide to an image, and writes the image link back into the originating row — so the person who requested it gets the asset without asking anyone.',
    role: 'Automation design and implementation',
    year: '2025',
    outcome: 'Removed a design hand-off from the sales workflow entirely.',
    tags: ['n8n', 'Google Slides API', 'Google Sheets', 'Image Automation'],
    kind: 'automation',
    status: 'internal',
  },
  {
    id: 'hr-document-generator',
    title: 'HR Document Generator',
    summary:
      'Generates offer letters, NDAs, relieving and experience letters from approved templates.',
    detail:
      'Every HR document that used to be copied from an old file and hand-edited is now generated from a maintained template. Plugged directly into the onboarding and offboarding workflows, so the document is produced as part of the process rather than as a separate task someone has to remember.',
    role: 'Automation design and implementation',
    year: '2025',
    outcome: 'Faster onboarding/offboarding with consistent, error-free documents.',
    tags: ['n8n', 'Google Docs API', 'Templating', 'HR'],
    kind: 'automation',
    status: 'internal',
  },
  {
    id: 'estimate-invoice-generator',
    title: 'Estimate & Invoice Generator',
    summary:
      'Sheet-triggered billing: raises the estimate in Zoho Books, and on approval issues and sends the invoice.',
    detail:
      'Client and project data lands in a Google Sheet and the workflow takes it from there — generating the first estimate through the Zoho Books API, then waiting on approval before creating the invoice and sending it to the client. The whole billing chain runs without anyone opening Zoho.',
    role: 'Automation design and implementation',
    year: '2025',
    outcome: 'End-to-end billing with no manual data entry.',
    tags: ['n8n', 'Zoho Books API', 'Google Sheets', 'Billing'],
    kind: 'automation',
    status: 'internal',
  },
  {
    id: 'hr-email-assistant',
    title: 'HR Email Assistant',
    summary:
      'Watches the HR inbox, classifies what arrives, and replies to candidates with real openings.',
    detail:
      'An agent monitoring the HR inbox: it categorises incoming mail, checks Joboo for openings that actually match, and sends candidates an automated reply pointing them at the right role to apply for directly — so applications arrive structured instead of as inbox threads.',
    role: 'Automation design and implementation',
    year: '2025',
    outcome: 'Candidates get a same-day response; HR inbox stays triaged.',
    tags: ['n8n', 'Email Automation', 'Joboo API', 'Classification'],
    kind: 'automation',
    status: 'internal',
  },
  {
    id: 'job-posting-agent',
    title: 'Job Posting Agent',
    summary: 'One job posted on Joboo fans out to email and drafted social copy for the design team.',
    detail:
      'Triggered the moment a role goes live on Joboo. It sends the announcement email through Brevo, generates social captions with relevant hashtags, and routes them to the design and social team ready for promotion — turning a posting into a distribution event automatically.',
    role: 'Automation design and implementation',
    year: '2025',
    outcome: 'Job posts reach every channel the same day they go live.',
    tags: ['n8n', 'Brevo API', 'Joboo', 'Social Automation'],
    kind: 'automation',
    status: 'internal',
  },
  {
    id: 'probation-reminder',
    title: 'Probation Reminder Agent',
    summary: 'Reads employee start dates and books the probation review before anyone forgets it.',
    detail:
      'Checks start dates and schedules Google Task reminders against probation completion, so review conversations get calendared automatically instead of depending on someone tracking dates in a spreadsheet.',
    role: 'Automation design and implementation',
    year: '2025',
    outcome: 'No missed probation reviews; zero manual tracking.',
    tags: ['n8n', 'Google Tasks API', 'HR'],
    kind: 'automation',
    status: 'internal',
  },

  /* ---------------------------------------------------------------------- */
  /*  QA                                                                     */
  /* ---------------------------------------------------------------------- */
  {
    id: 'vdoctor-qa',
    title: 'vDoctor — QA Testing',
    summary: 'Full manual QA sweep of a telemedicine platform across web and mobile.',
    detail:
      'Worked the vDoctor platform end to end on both web and mobile: walking real user workflows, surfacing UI inconsistencies, functional bugs and usability problems, and documenting each with the detail needed for the team to act on it rather than re-investigate it.',
    role: 'Manual QA, cross-platform testing, defect documentation',
    year: '2024',
    outcome: 'Documented defect set that fed directly into the product backlog.',
    tags: ['Manual Testing', 'QA', 'Cross-platform', 'Documentation'],
    demo: 'https://vdoctor-frontend.itechnotion.dev/login',
    kind: 'qa',
    status: 'live',
  },
];

/** Early builds. Real, but not what should lead the page. */
export const earlierWork = [
  {
    title: 'Portfolio Website',
    note: 'The site you are on — React, Tailwind, Framer Motion, Lenis.',
    href: 'https://github.com/sahiltalaviya99/portfolio',
  },
  {
    title: 'ForkFleet',
    note: 'Restaurant menu browsing and food ordering app. React + Vite.',
    href: 'https://github.com/sahiltalaviya99/forkfleet',
  },
  {
    title: 'Tic Tac Toe',
    note: 'Vanilla HTML/CSS/JS game with score tracking.',
    href: 'https://sahil-tictactoe.netlify.app',
  },
];

/**
 * These filter the "more work" grid, which excludes the featured ERPs — so
 * there is deliberately no 'erp' option here. Adding one would render an empty
 * grid while three ERP cards sit directly above it.
 */
export const projectFilters = [
  { id: 'all', label: 'All work' },
  { id: 'product', label: 'Products' },
  { id: 'automation', label: 'Automation' },
  { id: 'qa', label: 'QA' },
] as const;

export type ProjectFilter = (typeof projectFilters)[number]['id'];

export const statusLabel: Record<Project['status'], string> = {
  live: 'Live',
  internal: 'Internal system',
  'in-development': 'In development',
};
