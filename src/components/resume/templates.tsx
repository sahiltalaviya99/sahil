import type { CSSProperties, ReactNode } from 'react';

import type {
  ContactItem,
  ResumeDoc,
  ResumeEntry,
  ResumeProject,
  ResumeSkillRow,
} from '@/content/resume';

/**
 * Résumé templates.
 *
 * These render to plain elements with plain class names — **no Tailwind, no
 * hooks, no imports from the app**. That is a hard constraint, not a style
 * preference: `resume/build.mjs` renders these same components with
 * `react-dom/server` in Node to produce the PDF, where no Tailwind build has run
 * and no React runtime hooks exist. One implementation, two consumers, so the
 * page and the printed file cannot diverge.
 *
 * Styling lives entirely in resume.css.
 */

/** Every template takes the same two things: the document and the accent. */
export type TemplateProps = { doc: ResumeDoc; accent?: string | null };

/* -------------------------------------------------------------------------- */
/*  Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A contact detail, linked when it can be.
 *
 * The anchor is the point: Chrome's print pipeline emits a real PDF link
 * annotation for every `<a href>`, so in the finished file the email address
 * opens a mail client and the GitHub line opens GitHub. `rel` and `target` are
 * set for the on-screen preview, which is a live page.
 */
const Contact = ({ item }: { item: ContactItem }) =>
  item.href ? (
    <a className="rs-link" href={item.href} target="_blank" rel="noreferrer noopener">
      {item.label}
    </a>
  ) : (
    <span>{item.label}</span>
  );

const ContactLines = ({ doc }: { doc: ResumeDoc }) => (
  <div className="rs-contact">
    {doc.contactLines.map((line, i) => (
      <div key={i}>
        {line.map((item) => (
          <Contact key={item.label} item={item} />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Name and role on the left, contact block right-aligned opposite it, with a
 * two-tone rule beneath. The first version stacked all four lines flush left
 * under a plain hairline, which used a third of the page depth on a block that
 * nobody reads twice — this says the same thing in half the height and looks
 * set rather than typed. The reading order is still name → role → contacts, so
 * text extraction is unaffected.
 */
const Header = ({ doc }: { doc: ResumeDoc }) => (
  <>
    <header className="rs-header">
      <div className="rs-identity">
        <h1 className="rs-name">{doc.name}</h1>
        <div className="rs-role">{doc.role}</div>
      </div>
      <ContactLines doc={doc} />
    </header>
    <div className="rs-rule" aria-hidden />
  </>
);

/** Closing line: portfolio and phone, both clickable in the PDF. */
const Footer = ({ doc }: { doc: ResumeDoc }) =>
  doc.footer?.length ? (
    <p className="rs-note">
      {doc.footer.map((item) => (
        <Contact key={item.label} item={item} />
      ))}
    </p>
  ) : null;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rs-section">
    <h2 className="rs-h2">{title}</h2>
    {children}
  </section>
);

const Entry = ({ entry }: { entry: ResumeEntry }) => (
  <div className="rs-entry">
    <div className="rs-entry-head">
      <h3 className="rs-entry-title">
        {entry.title}
        {entry.org ? <span className="rs-org"> — {entry.org}</span> : null}
      </h3>
      <span className="rs-period">{entry.period}</span>
    </div>
    {entry.sub ? <div className="rs-sub">{entry.sub}</div> : null}
    {entry.points.length > 0 && (
      <ul>
        {entry.points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    )}
  </div>
);

const Project = ({ project }: { project: ResumeProject }) => (
  <div className="rs-project">
    <div className="rs-project-title">
      {project.title}
      {project.meta ? <span className="rs-project-meta"> · {project.meta}</span> : null}
    </div>
    <p>{project.body}</p>
    {project.stack ? <div className="rs-stack">{project.stack}</div> : null}
  </div>
);

const Skills = ({ rows }: { rows: ResumeSkillRow[] }) => (
  <dl className="rs-skills">
    {rows.map((row) => (
      <div key={row.id} style={{ display: 'contents' }}>
        <dt>{row.label}</dt>
        <dd>{row.items}</dd>
      </div>
    ))}
  </dl>
);

/* -------------------------------------------------------------------------- */
/*  Single column — Classic and Compact differ only in type scale (resume.css) */
/* -------------------------------------------------------------------------- */

/**
 * Sheet class + accent variable.
 *
 * `accent` is null by default and the sheet is black and white — see the note on
 * `--resume-accent` in resume.css. Written out longhand rather than with the
 * app's `cn` helper because this file must not import from the app: it is also
 * rendered in Node by resume/build.mjs.
 */
const sheetProps = (variant: string, accent?: string | null) => ({
  className: `resume-sheet ${variant}${accent ? '' : ' tone-mono'}`,
  style: accent ? ({ '--resume-accent': accent } as CSSProperties) : undefined,
});

const SingleColumn = ({
  doc,
  variant,
  accent,
}: {
  doc: ResumeDoc;
  variant: string;
  accent?: string | null;
}) => (
  <div {...sheetProps(variant, accent)}>
    <Header doc={doc} />

    {doc.profile ? (
      <Section title="Profile">
        <p className="rs-summary">{doc.profile}</p>
      </Section>
    ) : null}

    {doc.experience.length > 0 && (
      <Section title="Experience">
        {doc.experience.map((e) => (
          <Entry key={e.id} entry={e} />
        ))}
      </Section>
    )}

    {/* Skills before projects: the stack is the first thing a reader is
        scanning for, and it is four lines against the projects' twenty. */}
    {doc.skills.length > 0 && (
      <Section title="Technical Skills">
        <Skills rows={doc.skills} />
      </Section>
    )}

    {doc.projects.length > 0 && (
      <Section title="Projects">
        {doc.projects.map((p) => (
          <Project key={p.id} project={p} />
        ))}
      </Section>
    )}

    {doc.education.length > 0 && (
      <Section title="Education">
        {doc.education.map((e) => (
          <Entry key={e.id} entry={e} />
        ))}
      </Section>
    )}

    <Footer doc={doc} />
  </div>
);

export const Classic = ({ doc, accent }: TemplateProps) => (
  <SingleColumn doc={doc} accent={accent} variant="tpl-classic" />
);

export const Compact = ({ doc, accent }: TemplateProps) => (
  <SingleColumn doc={doc} accent={accent} variant="tpl-compact" />
);

/* -------------------------------------------------------------------------- */
/*  Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

export const Sidebar = ({ doc, accent }: TemplateProps) => (
  <div {...sheetProps('tpl-sidebar', accent)}>
    <aside className="rs-rail">
      <header className="rs-header">
        <div className="rs-identity">
          <h1 className="rs-name">{doc.name}</h1>
          <div className="rs-role">{doc.role}</div>
        </div>
      </header>

      <section className="rs-section">
        <h2 className="rs-h2">Contact</h2>
        <ContactLines doc={doc} />
      </section>

      {doc.skills.length > 0 && (
        <Section title="Skills">
          <Skills rows={doc.skills} />
        </Section>
      )}

      {doc.education.length > 0 && (
        <Section title="Education">
          {doc.education.map((e) => (
            <Entry key={e.id} entry={e} />
          ))}
        </Section>
      )}
    </aside>

    <div className="rs-main">
      {doc.profile ? (
        <Section title="Profile">
          <p className="rs-summary">{doc.profile}</p>
        </Section>
      ) : null}

      {doc.experience.length > 0 && (
        <Section title="Experience">
          {doc.experience.map((e) => (
            <Entry key={e.id} entry={e} />
          ))}
        </Section>
      )}

      {doc.projects.length > 0 && (
        <Section title="Projects">
          {doc.projects.map((p) => (
            <Project key={p.id} project={p} />
          ))}
        </Section>
      )}

      <Footer doc={doc} />
    </div>
  </div>
);

/* The registry — the `templates` array and `templateById` — lives in
   template-registry.ts, not here. A .tsx file that exports constants alongside
   its components trips `react-refresh/only-export-components` once per
   component, which is nine warnings from this file alone. Same split as
   motion-lab/registry.ts. */
