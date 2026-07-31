export type Entry = {
  id: string;
  title: string;
  org: string;
  period: string;
  /** Explicit — the old data inferred this from an icon name and got it wrong. */
  type: 'work' | 'education';
  current?: boolean;
  summary: string;
  /** Bullets do the real work here; keep each to one line. */
  points: string[];
  skills: string[];
};

export const experience: Entry[] = [
  {
    id: 'proofeasy',
    title: 'AI Engineer & Full Stack Developer',
    org: 'ProofEasy',
    // TODO(sahil): confirm the exact start month — the year boundary below is
    // an assumption based on the iTechNotion role running through 2025.
    period: '2026 — Present',
    type: 'work',
    current: true,
    summary:
      'Building enterprise ERP systems end to end — schema and API through to interface, test suite and deployment — across three industries: HVAC services, aesthetic healthcare and candle manufacturing.',
    points: [
      'Design and build full ERP platforms in Next.js, React, Node and PostgreSQL, plus a .NET stack where the client required it',
      'Own the whole vertical: database schema, API layer, front end, automated tests and deployment',
      'Cover critical flows with Playwright end-to-end tests so releases stop depending on manual checks',
      'Build AI-driven automation across n8n, Zapier and Make to remove recurring manual operations',
    ],
    skills: [
      'Next.js',
      'React',
      'Node.js',
      'PostgreSQL',
      '.NET',
      'Playwright',
      'n8n',
      'Deployment',
    ],
  },
  {
    id: 'itechnotion',
    title: 'Web Developer & Automation Expert',
    org: 'iTechNotion Pvt Ltd',
    period: '2025 — 2026',
    type: 'work',
    summary:
      'Shipped and maintained live client platforms across healthcare, wellness and email automation — working both the interface and the API behind it — and built the automation layer running the company’s HR, sales and marketing operations.',
    points: [
      'Built and shipped features across the full stack on three production client platforms',
      'Wrote and consumed REST endpoints, webhooks and real-time notification flows',
      'Designed n8n workflows replacing recurring manual work across three departments',
      'Owned performance on both sides — load time, render latency and redundant API calls',
    ],
    skills: [
      'React.js',
      'Next.js',
      'Node.js',
      'REST APIs',
      'JavaScript',
      'Tailwind CSS',
      'n8n',
      'Git',
    ],
  },
  {
    id: 'ibm-skillbuild',
    title: 'AI/ML Intern',
    org: 'IBM SkillBuild',
    period: 'May 2024',
    // Previously mis-tagged as education, which hid it from the Work filter.
    type: 'work',
    summary:
      'Fifteen-day intensive bootcamp on applied AI and machine learning, finishing with a working chatbot built on IBM Watson.',
    points: [
      'Built a functional chatbot on IBM Watson Assistant',
      'Hands-on with practical ML tooling and model workflows',
    ],
    skills: ['IBM Watson', 'Chatbot Development', 'Machine Learning', 'Python'],
  },
  {
    id: 'btech-it',
    title: 'B.Tech, Information Technology',
    org: 'Gandhinagar Institute of Technology',
    period: '2021 — 2025',
    type: 'education',
    summary:
      'Four-year degree in Information Technology, weighted towards web technologies and software engineering fundamentals.',
    points: [
      'Core: data structures, algorithms, OOP and database systems',
      'Elective focus on web technologies and software development practice',
    ],
    skills: ['Algorithms', 'Data Structures', 'OOP', 'Database Systems'],
  },
];

export const experienceFilters = [
  { id: 'all', label: 'Everything' },
  { id: 'work', label: 'Work' },
  { id: 'education', label: 'Education' },
] as const;

export type ExperienceFilter = (typeof experienceFilters)[number]['id'];
