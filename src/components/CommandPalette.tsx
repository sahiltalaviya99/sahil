import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Send,
  Terminal,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { SECTIONS, site, socials } from '@/content/site';
import { projects } from '@/content/projects';
import { useScrollToSection } from '@/hooks/use-section-nav';
import { COMMAND_PALETTE_EVENT } from '@/lib/command-palette';

/**
 * ⌘K palette — the site's primary navigation for anyone who'd rather type.
 *
 * Uses `cmdk` and `components/ui/command.tsx`, both of which were already
 * installed in this repo and completely unused, so this costs no new
 * dependency weight.
 *
 * Kept in a portal-based dialog so it works from any section, and the open
 * state is lifted here rather than in Navbar so the keyboard shortcut isn't
 * tied to the header being mounted.
 */
export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const scrollTo = useScrollToSection();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Listen for the navbar button (and anything else) asking to open.
  useEffect(() => {
    const openPalette = () => setOpen(true);
    window.addEventListener(COMMAND_PALETTE_EVENT, openPalette);
    return () => window.removeEventListener(COMMAND_PALETTE_EVENT, openPalette);
  }, []);

  /** Run an action, then close — every item does this. */
  const run = (fn: () => void) => {
    setOpen(false);
    // Let the dialog finish closing before scrolling, or Lenis fights the
    // dialog's own scroll-lock teardown.
    setTimeout(fn, 120);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      toast.success('Email copied to clipboard');
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  // Featured systems get their own group; the rest are searchable but grouped
  // under the general work jump.
  const systems = useMemo(() => projects.filter((p) => p.featured), []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a section, system, or action…" />

      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No match.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {SECTIONS.map((s, i) => (
            <CommandItem
              key={s.id}
              value={`go ${s.label} ${s.id}`}
              onSelect={() => run(() => scrollTo(s.id))}
            >
              <ArrowRight className="mr-2 h-4 w-4 text-primary" />
              <span>{s.label}</span>
              <CommandShortcut>{String(i + 1).padStart(2, '0')}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Systems">
          {systems.map((p) => (
            <CommandItem
              key={p.id}
              value={`system ${p.title} ${p.client ?? ''} ${p.tags.join(' ')}`}
              onSelect={() => run(() => scrollTo('work'))}
            >
              <Layers className="mr-2 h-4 w-4 text-primary" />
              <span className="truncate">{p.title}</span>
              {p.client && (
                <CommandShortcut className="truncate font-mono">{p.client}</CommandShortcut>
              )}
            </CommandItem>
          ))}
          <CommandItem value="all work projects systems" onSelect={() => run(() => scrollTo('work'))}>
            <Terminal className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>All {projects.length} systems</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="email contact write hire" onSelect={() => run(copyEmail)}>
            <Copy className="mr-2 h-4 w-4 text-primary" />
            <span>Copy email address</span>
            <CommandShortcut className="font-mono">{site.email}</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="send mail message"
            onSelect={() => run(() => (window.location.href = `mailto:${site.email}`))}
          >
            <Send className="mr-2 h-4 w-4 text-primary" />
            <span>Send an email</span>
          </CommandItem>

          <CommandItem
            value="resume cv download"
            onSelect={() => run(() => window.open(site.resume, '_blank'))}
          >
            <Download className="mr-2 h-4 w-4 text-primary" />
            <span>Download résumé</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Elsewhere">
          {socials
            .filter((s) => !s.download && s.name !== 'Email')
            .map((s) => (
              <CommandItem
                key={s.name}
                value={`open ${s.name} ${s.handle}`}
                onSelect={() => run(() => window.open(s.href, '_blank', 'noopener,noreferrer'))}
              >
                <s.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{s.name}</span>
                <CommandShortcut>
                  <ExternalLink className="h-3 w-3" />
                </CommandShortcut>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
