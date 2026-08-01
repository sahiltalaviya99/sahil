import { nodeAt, promptPath, resolvePath, root, type FsDir, type FsNode } from './terminal-fs';
import { SECTIONS, site } from '@/content/site';
import { projects } from '@/content/projects';
import { experience } from '@/content/experience';
import { allSkillNames } from '@/content/skills';
import { THEMES, applyTheme, type ThemeName } from './themes';

export type Line = { kind: 'in' | 'out' | 'err' | 'accent'; text: string };

export type CommandContext = {
  cwd: string[];
  setCwd: (path: string[]) => void;
  clear: () => void;
  scrollTo: (id: string) => void;
  copyEmail: () => void;
  history: string[];
  toggleFullscreen: () => void;
};

/** Walk every file in the tree, yielding [path, node]. */
const walkFiles = (node: FsNode, path: string[] = []): Array<[string, FsNode]> => {
  if (node.type === 'file') return [[path.join('/'), node]];
  return Object.values(node.children).flatMap((c) => walkFiles(c, [...path, c.name]));
};

export type Command = {
  name: string;
  usage: string;
  describe: string;
  /**
   * Other names that invoke this command. Resolved by `runCommand`, offered by
   * tab completion and printed by `help` — a hidden alias is the same as no
   * alias, since nobody guesses at a shell.
   */
  aliases?: string[];
  run: (args: string[], ctx: CommandContext) => Line[];
};

const out = (text: string): Line => ({ kind: 'out', text });
const err = (text: string): Line => ({ kind: 'err', text });
const accent = (text: string): Line => ({ kind: 'accent', text });

export const BANNER: Line[] = [
  accent('  ███████╗ █████╗ ██╗  ██╗██╗██╗     '),
  accent('  ██╔════╝██╔══██╗██║  ██║██║██║     '),
  accent('  ███████╗███████║███████║██║██║     '),
  accent('  ╚════██║██╔══██║██╔══██║██║██║     '),
  accent('  ███████║██║  ██║██║  ██║██║███████╗'),
  accent('  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝'),
  out(''),
  out(`  ${site.role}`),
  out(`  ${site.location} · @ ${site.company}`),
  out(''),
  out("  Type 'help' for commands, or 'ls' to look around."),
  out(''),
];

export const commands: Command[] = [
  {
    name: 'help',
    usage: 'help',
    describe: 'List every available command',
    run: () => [
      out(''),
      accent('  Available commands'),
      out(''),
      ...commands.map((c) =>
        out(
          `  ${c.usage.padEnd(20, ' ')} ${c.describe}${
            c.aliases?.length ? ` (or ${c.aliases.join(', ')})` : ''
          }`,
        ),
      ),
      out(''),
      out('  Tab completes · ↑/↓ walks history · Ctrl+L clears'),
      out(''),
    ],
  },
  {
    name: 'ls',
    usage: 'ls [path]',
    describe: 'List directory contents',
    run: (args, ctx) => {
      const target = args[0] ?? '.';
      const found = resolvePath(ctx.cwd, target);
      if (!found) return [err(`ls: ${target}: No such file or directory`)];
      if (found.node.type === 'file') return [out(found.node.name)];

      const children = Object.values((found.node as FsDir).children);
      if (!children.length) return [out('(empty)')];

      return [
        out(''),
        ...children.map((c) =>
          c.type === 'dir' ? accent(`  ${c.name}/`) : out(`  ${c.name}`),
        ),
        out(''),
      ];
    },
  },
  {
    name: 'cd',
    usage: 'cd <dir>',
    describe: 'Change directory',
    run: (args, ctx) => {
      const target = args[0] ?? '~';
      const found = resolvePath(ctx.cwd, target);
      if (!found) return [err(`cd: ${target}: No such file or directory`)];
      if (found.node.type !== 'dir') return [err(`cd: ${target}: Not a directory`)];
      ctx.setCwd(found.path);
      return [];
    },
  },
  {
    name: 'cat',
    usage: 'cat <file>',
    describe: 'Print a file',
    run: (args, ctx) => {
      if (!args[0]) return [err('cat: missing operand')];
      const found = resolvePath(ctx.cwd, args[0]);
      if (!found) return [err(`cat: ${args[0]}: No such file or directory`)];
      if (found.node.type === 'dir') return [err(`cat: ${args[0]}: Is a directory`)];
      return [out(''), ...found.node.lines.map(out), out('')];
    },
  },
  {
    name: 'pwd',
    usage: 'pwd',
    describe: 'Print working directory',
    run: (_a, ctx) => [out(promptPath(ctx.cwd))],
  },
  {
    name: 'tree',
    usage: 'tree',
    describe: 'Show the whole filesystem',
    run: () => {
      const lines: Line[] = [out('')];
      const walk = (node: FsDir, prefix: string) => {
        const kids = Object.values(node.children);
        kids.forEach((child, i) => {
          const last = i === kids.length - 1;
          const branch = last ? '└── ' : '├── ';
          if (child.type === 'dir') {
            lines.push(accent(`${prefix}${branch}${child.name}/`));
            walk(child, prefix + (last ? '    ' : '│   '));
          } else {
            lines.push(out(`${prefix}${branch}${child.name}`));
          }
        });
      };
      lines.push(accent('~'));
      walk(nodeAt([]) as FsDir, '');
      lines.push(out(''));
      return lines;
    },
  },
  {
    name: 'whoami',
    usage: 'whoami',
    describe: 'Who is this',
    run: () => [
      out(''),
      accent(`  ${site.name}`),
      out(`  ${site.role}`),
      out(`  ${site.tagline}`),
      out(''),
    ],
  },
  {
    name: 'projects',
    usage: 'projects',
    describe: 'Summarise every project',
    run: () => [
      out(''),
      ...projects.map((p) =>
        out(`  ${p.title.padEnd(38, ' ')} ${p.kind.padEnd(11, ' ')} ${p.year}`),
      ),
      out(''),
      out(`  ${projects.length} total. Try 'cd projects' then 'cat <name>.md'.`),
      out(''),
    ],
  },
  {
    name: 'open',
    usage: 'open <section>',
    describe: 'Scroll to a section of the site',
    run: (args, ctx) => {
      const id = args[0]?.toLowerCase();
      const match = SECTIONS.find((s) => s.id === id || s.label.toLowerCase() === id);
      if (!match) {
        return [
          err(`open: unknown section '${args[0] ?? ''}'`),
          out(`  try: ${SECTIONS.map((s) => s.id).join(', ')}`),
        ];
      }
      ctx.scrollTo(match.id);
      return [out(`Navigating to ${match.label}…`)];
    },
  },
  {
    name: 'email',
    usage: 'email',
    describe: 'Copy the email address',
    run: (_a, ctx) => {
      ctx.copyEmail();
      return [out(`Copied ${site.email} to clipboard.`)];
    },
  },
  {
    name: 'phone',
    usage: 'phone',
    describe: 'Show the phone number',
    run: () => [out(`${site.phone}   (${site.phoneHref})`)],
  },
  {
    name: 'resume',
    usage: 'resume',
    describe: 'Download the résumé PDF',
    run: () => {
      window.open(site.resume, '_blank');
      return [out('Opening résumé…')];
    },
  },
  {
    name: 'banner',
    usage: 'banner',
    describe: 'Reprint the banner',
    run: () => BANNER,
  },
  {
    name: 'echo',
    usage: 'echo <text>',
    describe: 'Print text back',
    run: (args) => [out(args.join(' '))],
  },
  {
    name: 'clear',
    usage: 'clear',
    describe: 'Clear the screen',
    // `cls` because half the people who try this will have come from Windows.
    aliases: ['cls'],
    run: (_a, ctx) => {
      ctx.clear();
      return [];
    },
  },
  {
    name: 'grep',
    usage: 'grep <term>',
    describe: 'Search every file for a term',
    run: (args) => {
      const term = args.join(' ').trim();
      if (!term) return [err('grep: missing search term')];

      const needle = term.toLowerCase();
      const hits: Line[] = [];

      for (const [path, node] of walkFiles(root)) {
        if (node.type !== 'file') continue;
        node.lines.forEach((line, i) => {
          if (line.toLowerCase().includes(needle)) {
            hits.push(accent(`  ${path}:${i + 1}`));
            hits.push(out(`    ${line.trim()}`));
          }
        });
      }

      if (!hits.length) return [out(`No matches for '${term}'.`)];
      return [out(''), ...hits.slice(0, 60), out(''), out(`${hits.length / 2} match(es).`), out('')];
    },
  },
  {
    name: 'find',
    usage: 'find <name>',
    describe: 'Find files by name',
    run: (args) => {
      const term = (args[0] ?? '').toLowerCase();
      if (!term) return [err('find: missing name')];

      const hits = walkFiles(root)
        .filter(([path]) => path.toLowerCase().includes(term))
        .map(([path]) => out(`  ~/${path}`));

      return hits.length ? [out(''), ...hits, out('')] : [out(`No file matching '${term}'.`)];
    },
  },
  {
    name: 'man',
    usage: 'man <command>',
    describe: 'Show the manual for a command',
    run: (args) => {
      const cmd = commands.find((c) => c.name === args[0]);
      if (!cmd) return [err(`man: no entry for '${args[0] ?? ''}'`)];
      return [
        out(''),
        accent(`  NAME`),
        out(`      ${cmd.name} — ${cmd.describe}`),
        out(''),
        accent(`  SYNOPSIS`),
        out(`      ${cmd.usage}`),
        out(''),
      ];
    },
  },
  {
    name: 'history',
    usage: 'history',
    describe: 'Show recent commands',
    run: (_a, ctx) => {
      if (!ctx.history.length) return [out('No history yet.')];
      return [
        out(''),
        ...ctx.history
          .slice()
          .reverse()
          .map((h, i) => out(`  ${String(i + 1).padStart(3, ' ')}  ${h}`)),
        out(''),
      ];
    },
  },
  {
    name: 'neofetch',
    usage: 'neofetch',
    describe: 'System info, portfolio edition',
    run: () => {
      const art = [
        '     ▄▄▄▄▄▄▄     ',
        '   ▄█████████▄   ',
        '  ███▀     ▀███  ',
        '  ██▀  ▄▄▄  ▀██  ',
        '  ██   ███   ██  ',
        '  ██▄  ▀▀▀  ▄██  ',
        '  ███▄     ▄███  ',
        '   ▀█████████▀   ',
        '     ▀▀▀▀▀▀▀     ',
      ];
      const info = [
        `${site.shortName.toLowerCase()}@portfolio`,
        '─────────────────────',
        `Role      ${site.role}`,
        `Company   ${site.company}`,
        `Location  ${site.location}`,
        `Projects  ${projects.length}`,
        `Roles     ${experience.filter((e) => e.type === 'work').length}`,
        `Skills    ${allSkillNames.length}`,
        `Stack     Next.js · Node · PostgreSQL`,
        `Shell     portfolio-sh 1.0`,
        `Uptime    open to opportunities`,
      ];

      const rows = Math.max(art.length, info.length);
      const lines: Line[] = [out('')];
      for (let i = 0; i < rows; i++) {
        const left = (art[i] ?? '').padEnd(19, ' ');
        lines.push(i < 2 ? accent(`${left}${info[i] ?? ''}`) : out(`${left}${info[i] ?? ''}`));
      }
      lines.push(out(''));
      return lines;
    },
  },
  {
    name: 'theme',
    usage: 'theme [name]',
    describe: 'Recolour the entire site live',
    run: (args) => {
      const name = args[0]?.toLowerCase() as ThemeName | undefined;

      if (!name) {
        return [
          out(''),
          out('  Available themes:'),
          ...Object.entries(THEMES).map(([key, t]) => out(`    ${key.padEnd(10, ' ')} ${t.label}`)),
          out(''),
          out('  Usage: theme azure'),
          out(''),
        ];
      }

      if (!THEMES[name]) return [err(`theme: unknown theme '${name}'`)];

      applyTheme(name);
      return [
        out(`Applied '${name}'.`),
        out('Every colour on the page resolves through --primary, so that one'),
        out('property reskinned the whole site — buttons, glows, charts, canvas.'),
      ];
    },
  },
  {
    name: 'fullscreen',
    usage: 'fullscreen',
    describe: 'Expand the terminal to fill the screen',
    run: (_a, ctx) => {
      ctx.toggleFullscreen();
      return [out('Toggled fullscreen. Press Escape to exit.')];
    },
  },
  {
    name: 'sudo',
    usage: 'sudo <anything>',
    describe: 'Nice try',
    run: () => [err('sudo: permission denied — this is a portfolio, not a production box.')],
  },
];

/** Every invokable token, aliases included — this is what Tab completes against. */
export const commandNames = commands.flatMap((c) => [c.name, ...(c.aliases ?? [])]);

/**
 * Does this input clear the buffer?
 *
 * `clear` empties the buffer inside its own handler, so a caller that appends
 * the echoed prompt line afterwards would immediately undo it. Both terminals
 * need to know, and hardcoding the string in each is how the `cls` alias would
 * get missed in one of them.
 */
export const clearsScreen = (input: string): boolean => {
  const name = input.trim().split(/\s+/)[0]?.toLowerCase();
  return name === 'clear' || name === 'cls';
};

export const runCommand = (input: string, ctx: CommandContext): Line[] => {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return [];

  const lower = name.toLowerCase();
  const cmd = commands.find((c) => c.name === lower || c.aliases?.includes(lower));
  if (!cmd) {
    return [
      err(`command not found: ${name}`),
      out("Type 'help' to see what's available."),
    ];
  }
  return cmd.run(args, ctx);
};

/** Tab completion: commands at position 0, path entries after. */
export const complete = (input: string, cwd: string[]): string | null => {
  const parts = input.split(/\s+/);

  if (parts.length <= 1) {
    const matches = commandNames.filter((c) => c.startsWith(parts[0] ?? ''));
    return matches.length === 1 ? matches[0] + ' ' : null;
  }

  const partial = parts[parts.length - 1];
  const slash = partial.lastIndexOf('/');
  const dirPart = slash >= 0 ? partial.slice(0, slash) : '.';
  const stem = slash >= 0 ? partial.slice(slash + 1) : partial;

  const found = resolvePath(cwd, dirPart);
  if (!found || found.node.type !== 'dir') return null;

  const matches = Object.keys(found.node.children).filter((n) => n.startsWith(stem));
  if (matches.length !== 1) return null;

  const completed = slash >= 0 ? `${dirPart}/${matches[0]}` : matches[0];
  return [...parts.slice(0, -1), completed].join(' ');
};
