import { Github, Linkedin, Mail, FileText, type LucideIcon } from 'lucide-react';

/**
 * Single source of truth for identity, navigation and contact.
 * Nothing here is duplicated in a component — if you need to change copy,
 * change it here.
 */

export const site = {
  name: 'Sahil Talaviya',
  shortName: 'Sahil',
  /** Used for SEO, schema.org and the portrait caption. */
  role: 'AI Engineer & Full Stack Developer',
  /**
   * Cycled by the hero so every side of the work gets stated rather than
   * compressed into one title. Keep each under ~26 chars — longer strings
   * make the line wrap and the layout jump.
   */
  roles: [
    'AI Engineer',
    'Full Stack Developer',
    'Automation Engineer',
    'ERP Systems Builder',
  ],
  company: 'ProofEasy',
  location: 'Ahmedabad, Gujarat',
  available: true,
  email: 'sahiltalaviya9922@gmail.com',
  /**
   * Display form and dial form are kept separate on purpose: `tel:` needs the
   * unspaced E.164 number to work from a phone, while the spaced version is
   * what a human should read. An earlier revision had a placeholder
   * +919999999999 sitting behind the real display text — never let these drift.
   */
  phone: '+91 99096 57018',
  phoneHref: 'tel:+919909657018',
  resume: '/Sahil Talaviya Resume.pdf',
  tagline:
    'I build complete systems end to end — front end, backend, API, database, deployment — and the AI automation that runs them without anyone touching a spreadsheet.',
  // The meta description lives in index.html, not here — one source of truth
  // so the two can't drift apart.
} as const;

/**
 * Anchors on the home route. Nav order === section order in Index.tsx.
 * Add a section here and nowhere else.
 *
 * Terminal and Lab used to live here. They now have their own route (see
 * ROUTES) because the interactive work outgrew a couple of sections — nine
 * exhibits stapled onto the bottom of a portfolio made the scroll interminable
 * and buried the actual work above them.
 */
export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/**
 * Standalone pages, shown in the nav alongside the section anchors.
 * These are react-router destinations, not scroll targets.
 */
export const ROUTES = [
  { path: '/lab', label: 'Lab' },
  { path: '/motion', label: 'Motion' },
] as const;

/**
 * The résumé builder.
 *
 * **Deliberately not in `ROUTES`.** Everything in that array is picked up by the
 * navbar, the mobile drawer, the ⌘K palette *and* the footer sitemap; this page
 * is linked from the footer only, by one hand-placed `<Link>` in Footer.tsx.
 * Adding it to `ROUTES` would put an editor for the site owner's CV in the main
 * navigation, which is not what it is for.
 */
export const RESUME_BUILDER_PATH = '/sahil9909657018';

export type Social = {
  name: string;
  href: string;
  handle: string;
  icon: LucideIcon;
  download?: boolean;
};

export const socials: Social[] = [
  {
    name: 'GitHub',
    href: 'https://github.com/sahiltalaviya99',
    handle: 'sahiltalaviya99',
    icon: Github,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/sahil-talaviya-99o9657o18',
    handle: 'sahil-talaviya',
    icon: Linkedin,
  },
  {
    name: 'Email',
    href: `mailto:${site.email}`,
    handle: site.email,
    icon: Mail,
  },
  {
    name: 'Résumé',
    href: site.resume,
    handle: 'Download PDF',
    icon: FileText,
    download: true,
  },
];

/**
 * The About section's visual. Rather than a portrait, it renders the actual
 * claim — that the whole vertical gets built by one person — as a stack of
 * layers that light up in sequence on scroll.
 */
export const systemLayers = [
  { id: 'interface', label: 'Interface', stack: 'Next.js · React · Tailwind' },
  { id: 'api', label: 'API layer', stack: 'Node · REST · Webhooks' },
  { id: 'data', label: 'Data', stack: 'PostgreSQL · schema design' },
  { id: 'testing', label: 'Testing', stack: 'Playwright end-to-end' },
  { id: 'automation', label: 'Automation', stack: 'n8n · Zapier · Make' },
  { id: 'deploy', label: 'Deployment', stack: 'Vercel · Netlify · servers' },
];

/**
 * Every figure below is derived from the project and experience data in this
 * folder — none of it is invented. If you add work, update these to match.
 */
export const stats = [
  { value: 3, suffix: '', label: 'Enterprise ERP systems built end to end' },
  { value: 7, suffix: '', label: 'AI automation workflows in production' },
  { value: 15, suffix: '+', label: 'Projects shipped across web and automation' },
];
