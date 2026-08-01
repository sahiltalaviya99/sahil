import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';

import {
  cloneResume,
  defaultResume,
  hrefFor,
  type ContactItem,
  type ResumeDoc,
} from '@/content/resume';
import {
  accentById,
  accents,
  templateById,
  templates,
  type TemplateId,
} from '@/components/resume/template-registry';
import { safeGet, safeRemove, safeSet } from '@/lib/safe-storage';
import { cn } from '@/lib/utils';
import '@/components/resume/resume.css';

/**
 * The résumé editor.
 *
 * **Absent from `ROUTES`, the footer sitemap and the ⌘K palette** — the single
 * link to it is hand-placed at the bottom of Footer.tsx, so it stays out of the
 * main navigation. Nothing of Sahil's is at risk from it being reachable: the
 * document is seeded from `src/content/resume.ts` and a visitor's edits live in
 * their own browser's localStorage.
 *
 * It is mounted *outside* `SiteChrome`, so there is no navbar, footer,
 * preloader or custom cursor here. A full-screen tool should not wear the
 * site's furniture, and none of it would survive `window.print()` anyway.
 *
 * PDF export is `window.print()` against the print block in resume.css — no
 * library. jsPDF and html2canvas both rasterise, which produces a résumé whose
 * text cannot be selected, searched or parsed by an applicant-tracking system;
 * the browser's own print pipeline emits real text with real fonts, which is
 * the only acceptable output for this document.
 */

const DRAFT_KEY = 'resume-draft';
const TEMPLATE_KEY = 'resume-template';
const ACCENT_KEY = 'resume-accent';
/** 210mm at 96dpi — the sheet's fixed width, used to scale the preview. */
const SHEET_PX = (210 / 25.4) * 96;

/* -------------------------------------------------------------------------- */
/*  Draft persistence                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Contact lines were plain strings before they carried links. A draft saved then
 * still holds `string[][]`, and the templates now read `item.label` — which on a
 * string is `undefined`, so every contact detail would silently vanish from a
 * returning user's résumé. Upgrade in place, inferring the href.
 */
const normalizeContacts = (lines: unknown): ContactItem[][] | undefined => {
  if (!Array.isArray(lines)) return undefined;
  return lines.map((line) =>
    (Array.isArray(line) ? line : []).map((item) =>
      typeof item === 'string'
        ? { label: item, href: hrefFor(item) }
        : (item as ContactItem),
    ),
  );
};

const loadDraft = (): ResumeDoc => {
  const raw = safeGet(DRAFT_KEY, 'local');
  if (!raw) return cloneResume(defaultResume);
  try {
    const parsed = JSON.parse(raw) as Partial<ResumeDoc>;
    /* Merge over the default rather than trusting the stored shape. A draft
       saved before a field existed would otherwise render `undefined.map` and
       take the page down — and the only recovery would be clearing storage,
       which the person who lost their draft cannot be expected to know. */
    const merged = { ...cloneResume(defaultResume), ...parsed } as ResumeDoc;
    const contacts = normalizeContacts(parsed.contactLines);
    if (contacts) merged.contactLines = contacts;
    /* The closing line used to be a `note` string. A draft saved then carries no
       `footer`, and the spread would leave the default in place — correct — but
       a draft saved *after* the rename with an emptied footer must stay empty,
       so only normalise when the key is actually present. */
    if ('footer' in parsed) merged.footer = normalizeContacts([parsed.footer])?.[0] ?? [];
    return merged;
  } catch {
    return cloneResume(defaultResume);
  }
};

/* -------------------------------------------------------------------------- */
/*  Form primitives                                                            */
/* -------------------------------------------------------------------------- */

const inputClass =
  'w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/60';

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) => (
  <label className="block">
    <span className="mb-1 block font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
      {label}
      {hint && <span className="ml-2 normal-case tracking-normal opacity-70">{hint}</span>}
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClass}
    />
  </label>
);

const Area = ({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) => (
  <label className="block">
    <span className="mb-1 block font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
      {label}
      {hint && <span className="ml-2 normal-case tracking-normal opacity-70">{hint}</span>}
    </span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={cn(inputClass, 'resize-y leading-relaxed')}
    />
  </label>
);

/**
 * A named "Add <thing>" button, at the top *and* bottom of every repeatable
 * list. The first draft had one unlabelled "Add" in the section header, which
 * read as decoration — and once a list is four cards long the control you want
 * is scrolled off the top of the pane, so the bottom copy is the one that
 * actually gets used.
 */
const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary sm:min-h-10"
  >
    <Plus className="h-3.5 w-3.5" /> {label}
  </button>
);

const Group = ({
  title,
  children,
  addLabel,
  onAdd,
}: {
  title: string;
  children: ReactNode;
  addLabel?: string;
  onAdd?: () => void;
}) => (
  <section className="mt-8 first:mt-0">
    <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-2">
      <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> {addLabel ?? 'Add'}
        </button>
      )}
    </div>
    <div className="space-y-4">{children}</div>
    {onAdd && (
      <div className="mt-4">
        <AddButton label={addLabel ?? 'Add'} onClick={onAdd} />
      </div>
    )}
  </section>
);

const Card = ({
  children,
  onRemove,
  onUp,
  onDown,
}: {
  children: ReactNode;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
}) => (
  <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <div className="flex justify-end gap-1">
      <button
        onClick={onUp}
        aria-label="Move up"
        className="min-h-9 rounded px-2 text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ↑
      </button>
      <button
        onClick={onDown}
        aria-label="Move down"
        className="min-h-9 rounded px-2 text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ↓
      </button>
      <button
        onClick={onRemove}
        aria-label="Remove"
        className="min-h-9 rounded px-2 text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
    {children}
  </div>
);

/**
 * Ids for newly-added cards. They are React keys, so two entries sharing one id
 * makes the second uneditable — typing into it writes to the first. Derived from
 * the list length, which is what the first version did, collides the moment you
 * delete the middle card and add another.
 */
const newId = (prefix: string) =>
  `${prefix}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

/** Reorder helper shared by every repeatable list. */
const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

const ResumeBuilder = () => {
  const [doc, setDoc] = useState<ResumeDoc>(loadDraft);
  const [templateId, setTemplateId] = useState<TemplateId>(
    () => (safeGet(TEMPLATE_KEY, 'local') as TemplateId) || 'classic',
  );
  const [accentId, setAccentId] = useState<string>(() => safeGet(ACCENT_KEY, 'local') || 'mono');
  const [pane, setPane] = useState<'edit' | 'preview'>('edit');

  const template = templateById(templateId);
  const accent = accentById(accentId).value;
  const Sheet = template.Component;

  /* The filename Chrome offers in its Save-as-PDF dialog is the document title,
     so this is not cosmetic — it is the difference between "Sahil Talaviya —
     Resume.pdf" and "localhost.pdf". */
  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.name} — Resume`;
    return () => {
      document.title = previous;
    };
  }, [doc.name]);

  // Persist to localStorage, not session: a draft that evaporates when the tab
  // closes is worse than no draft at all.
  useEffect(() => {
    safeSet(DRAFT_KEY, JSON.stringify(doc), 'local');
  }, [doc]);

  useEffect(() => {
    safeSet(TEMPLATE_KEY, templateId, 'local');
  }, [templateId]);

  useEffect(() => {
    safeSet(ACCENT_KEY, accentId, 'local');
  }, [accentId]);

  const patch = useCallback((fields: Partial<ResumeDoc>) => setDoc((d) => ({ ...d, ...fields })), []);

  const reset = () => {
    if (!window.confirm('Discard your edits and start from the site content again?')) return;
    safeRemove(DRAFT_KEY, 'local');
    setDoc(cloneResume(defaultResume));
  };

  /* ---------------------------------------------------------------------- */
  /*  Preview scaling                                                        */
  /* ---------------------------------------------------------------------- */

  const frameRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [frameHeight, setFrameHeight] = useState(0);

  /* The sheet is a fixed 210mm — the whole point, since that is what prints —
     so it is scaled down to whatever space the preview column has rather than
     being allowed to force the page sideways. Layout effect, not effect: this
     runs before paint, so the preview never flashes at full size first. */
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const sheet = sheetRef.current;
    if (!frame || !sheet) return;

    const measure = () => {
      const available = frame.clientWidth;
      const next = Math.min(1, available / SHEET_PX);
      setScale(next);
      // The scaled element is out of flow for sizing purposes, so the frame has
      // to be told how tall the result is or the page ends at the top of it.
      setFrameHeight(sheet.getBoundingClientRect().height);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [templateId, accentId, doc]);

  /* ---------------------------------------------------------------------- */

  /* The preview scrolls inside its own pane rather than growing the page.
     The sheet is a fixed 210mm and can run to several A4 pages; letting it drive
     the document height means the editor column ends long before it does, and
     you scroll past the end of the form to read the bottom of the résumé.
     `overscroll-contain` plus Lenis's `allowNestedScroll` hands the scroll back
     to the page once the pane bottoms out instead of trapping the pointer. */
  const preview = (
    <div className="rounded-2xl border border-border bg-surface/40 p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground">
          A4 preview · {template.label}
        </span>
        <span className="font-mono text-[0.62rem] text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
      </div>

      <div className="max-h-[calc(100svh-13rem)] overflow-auto overscroll-contain rounded-xl bg-elevated/40 p-3">
        <div ref={frameRef} style={{ height: frameHeight || undefined }} className="min-w-0">
          <div
            ref={sheetRef}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: SHEET_PX }}
            className="shadow-2xl"
          >
            <Sheet doc={doc} accent={accent} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <main className="min-h-[100svh] bg-background">
        {/* -------------------------------- Toolbar -------------------------------- */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
            <div className="mr-auto min-w-0">
              <h1 className="font-display text-base font-semibold tracking-tight">Résumé builder</h1>
              <p className="font-mono text-[0.62rem] text-muted-foreground">
                Private · edits saved in this browser
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-surface p-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    'min-h-9 rounded-full px-3.5 text-xs font-medium transition-colors sm:min-h-0 sm:py-1.5',
                    templateId === t.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Accent swatches. Black & white is first and is the default —
                the mono chip shows the ink colour with a slash through it so it
                reads as "no colour" rather than as a black accent. */}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-1.5">
              {accents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccentId(a.id)}
                  title={a.label}
                  aria-label={a.label}
                  aria-pressed={accentId === a.id}
                  style={{ background: a.value ?? '#14171a' }}
                  className={cn(
                    'relative h-6 w-6 rounded-full ring-offset-2 ring-offset-surface transition-all',
                    accentId === a.id ? 'ring-2 ring-primary' : 'ring-1 ring-white/15 hover:ring-white/40',
                  )}
                >
                  {!a.value && (
                    <span className="absolute inset-0 grid place-items-center text-[0.7rem] leading-none text-white/70">
                      /
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={reset}
              className="flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>

            <button onClick={() => window.print()} className="btn-primary min-h-9 gap-2 text-xs">
              <Printer className="h-4 w-4" /> Save as PDF
            </button>
          </div>

          {/* One pane at a time below lg — an editor and a page preview side by
              side on a phone gives you neither. */}
          <div className="mx-auto flex max-w-[110rem] gap-1 px-4 pb-3 sm:px-6 lg:hidden">
            {(['edit', 'preview'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPane(p)}
                className={cn(
                  'min-h-11 flex-1 rounded-lg border text-xs font-medium capitalize transition-colors',
                  pane === p
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </header>

        <div className="mx-auto grid max-w-[110rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
          {/* -------------------------------- Editor -------------------------------- */}
          <div className={cn('min-w-0', pane === 'edit' ? 'block' : 'hidden', 'lg:block')}>
            <p className="mb-6 rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
              {template.note}
            </p>

            <Group title="Identity">
              <Field label="Name" value={doc.name} onChange={(name) => patch({ name })} />
              <Field label="Role" value={doc.role} onChange={(role) => patch({ role })} />
              {/* Plain text in, links inferred out — see `hrefFor`. An email
                  becomes a mailto:, a bare domain becomes https://, a +number
                  becomes a tel:, and a city correctly stays unlinked. */}
              {doc.contactLines.map((line, i) => (
                <Field
                  key={i}
                  label={`Contact line ${i + 1}`}
                  hint={line.filter((x) => x.href).length + ' linked'}
                  value={line.map((x) => x.label).join(' · ')}
                  placeholder="separate items with ·"
                  onChange={(v) =>
                    patch({
                      contactLines: doc.contactLines.map((l, j) =>
                        j === i
                          ? v
                              .split('·')
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((label) => {
                                /* Keep an explicitly-set href when the label is
                                   unchanged — `site.phoneHref` is the E.164 dial
                                   form and must not be re-derived away. */
                                const existing = l.find((x) => x.label === label);
                                return existing ?? { label, href: hrefFor(label) };
                              })
                          : l,
                      ),
                    })
                  }
                />
              ))}
            </Group>

            <Group title="Profile">
              <Area
                label="Summary"
                value={doc.profile}
                rows={6}
                onChange={(profile) => patch({ profile })}
              />
            </Group>

            <Group
              title="Experience"
              addLabel="Add experience"
              onAdd={() =>
                patch({
                  experience: [
                    ...doc.experience,
                    { id: newId('role'), title: '', org: '', period: '', sub: '', points: [] },
                  ],
                })
              }
            >
              {doc.experience.map((e, i) => (
                <Card
                  key={e.id}
                  onRemove={() => patch({ experience: doc.experience.filter((_, j) => j !== i) })}
                  onUp={() => patch({ experience: move(doc.experience, i, i - 1) })}
                  onDown={() => patch({ experience: move(doc.experience, i, i + 1) })}
                >
                  {(
                    [
                      ['Title', 'title'],
                      ['Organisation', 'org'],
                      ['Period', 'period'],
                    ] as const
                  ).map(([label, key]) => (
                    <Field
                      key={key}
                      label={label}
                      value={e[key]}
                      onChange={(v) =>
                        patch({
                          experience: doc.experience.map((x, j) =>
                            j === i ? { ...x, [key]: v } : x,
                          ),
                        })
                      }
                    />
                  ))}
                  <Area
                    label="One-liner"
                    value={e.sub}
                    rows={2}
                    onChange={(v) =>
                      patch({
                        experience: doc.experience.map((x, j) => (j === i ? { ...x, sub: v } : x)),
                      })
                    }
                  />
                  <Area
                    label="Bullets"
                    hint="one per line"
                    value={e.points.join('\n')}
                    rows={5}
                    onChange={(v) =>
                      patch({
                        experience: doc.experience.map((x, j) =>
                          j === i ? { ...x, points: v.split('\n').filter((l) => l.trim()) } : x,
                        ),
                      })
                    }
                  />
                </Card>
              ))}
            </Group>

            <Group
              title="Selected work"
              addLabel="Add project"
              onAdd={() =>
                patch({
                  projects: [
                    ...doc.projects,
                    { id: newId('project'), title: '', meta: '', body: '', stack: '' },
                  ],
                })
              }
            >
              {doc.projects.map((p, i) => (
                <Card
                  key={p.id}
                  onRemove={() => patch({ projects: doc.projects.filter((_, j) => j !== i) })}
                  onUp={() => patch({ projects: move(doc.projects, i, i - 1) })}
                  onDown={() => patch({ projects: move(doc.projects, i, i + 1) })}
                >
                  <Field
                    label="Title"
                    value={p.title}
                    onChange={(v) =>
                      patch({
                        projects: doc.projects.map((x, j) => (j === i ? { ...x, title: v } : x)),
                      })
                    }
                  />
                  <Field
                    label="Meta"
                    value={p.meta}
                    placeholder="client · year · status"
                    onChange={(v) =>
                      patch({
                        projects: doc.projects.map((x, j) => (j === i ? { ...x, meta: v } : x)),
                      })
                    }
                  />
                  <Area
                    label="Description"
                    value={p.body}
                    rows={5}
                    onChange={(v) =>
                      patch({
                        projects: doc.projects.map((x, j) => (j === i ? { ...x, body: v } : x)),
                      })
                    }
                  />
                  <Field
                    label="Stack"
                    value={p.stack}
                    onChange={(v) =>
                      patch({
                        projects: doc.projects.map((x, j) => (j === i ? { ...x, stack: v } : x)),
                      })
                    }
                  />
                </Card>
              ))}
            </Group>

            <Group
              title="Skills"
              addLabel="Add skill group"
              onAdd={() =>
                patch({ skills: [...doc.skills, { id: newId('skills'), label: '', items: '' }] })
              }
            >
              {doc.skills.map((row, i) => (
                <Card
                  key={row.id}
                  onRemove={() => patch({ skills: doc.skills.filter((_, j) => j !== i) })}
                  onUp={() => patch({ skills: move(doc.skills, i, i - 1) })}
                  onDown={() => patch({ skills: move(doc.skills, i, i + 1) })}
                >
                  <Field
                    label="Group"
                    value={row.label}
                    onChange={(v) =>
                      patch({ skills: doc.skills.map((x, j) => (j === i ? { ...x, label: v } : x)) })
                    }
                  />
                  <Area
                    label="Items"
                    hint="separate with ·"
                    value={row.items}
                    rows={2}
                    onChange={(v) =>
                      patch({ skills: doc.skills.map((x, j) => (j === i ? { ...x, items: v } : x)) })
                    }
                  />
                </Card>
              ))}
            </Group>

            <Group
              title="Education"
              addLabel="Add education"
              onAdd={() =>
                patch({
                  education: [
                    ...doc.education,
                    { id: newId('edu'), title: '', org: '', period: '', sub: '', points: [] },
                  ],
                })
              }
            >
              {doc.education.map((e, i) => (
                <Card
                  key={e.id}
                  onRemove={() => patch({ education: doc.education.filter((_, j) => j !== i) })}
                  onUp={() => patch({ education: move(doc.education, i, i - 1) })}
                  onDown={() => patch({ education: move(doc.education, i, i + 1) })}
                >
                  {(
                    [
                      ['Qualification', 'title'],
                      ['Institution', 'org'],
                      ['Period', 'period'],
                    ] as const
                  ).map(([label, key]) => (
                    <Field
                      key={key}
                      label={label}
                      value={e[key]}
                      onChange={(v) =>
                        patch({
                          education: doc.education.map((x, j) => (j === i ? { ...x, [key]: v } : x)),
                        })
                      }
                    />
                  ))}
                  <Area
                    label="Detail"
                    value={e.sub}
                    rows={3}
                    onChange={(v) =>
                      patch({
                        education: doc.education.map((x, j) => (j === i ? { ...x, sub: v } : x)),
                      })
                    }
                  />
                </Card>
              ))}
            </Group>

            <Group title="Closing line">
              <Field
                label="Footer"
                hint={`${doc.footer.filter((x) => x.href).length} linked`}
                placeholder="separate items with ·"
                value={doc.footer.map((x) => x.label).join(' · ')}
                onChange={(v) =>
                  patch({
                    footer: v
                      .split('·')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((label) => doc.footer.find((x) => x.label === label) ?? { label, href: hrefFor(label) }),
                  })
                }
              />
            </Group>
          </div>

          {/* ------------------------------- Preview -------------------------------- */}
          <div className={cn('min-w-0', pane === 'preview' ? 'block' : 'hidden', 'lg:block')}>
            <div className="lg:sticky lg:top-28">{preview}</div>
          </div>
        </div>
      </main>

      {/* The copy that actually prints. Portalled to <body> so the print rule can
          hide #root wholesale — nothing of the dark theme or the app chrome can
          bleed onto the page that way. */}
      {createPortal(
        <div className="resume-print-portal">
          <Sheet doc={doc} accent={accent} />
        </div>,
        document.body,
      )}
    </>
  );
};

export default ResumeBuilder;
