/**
 * Live accent swapping, driven from the terminal's `theme` command.
 *
 * This exists as much as a demonstration as a feature: because every colour in
 * the site resolves through `--primary` / `--primary-hi`, changing two custom
 * properties reskins the entire page — buttons, glows, charts, the workflow
 * canvas, the spotlight gradient. Nothing else has to know.
 */

export type ThemeName = 'emerald' | 'azure' | 'amber' | 'violet' | 'rose';

export const THEMES: Record<ThemeName, { primary: string; hi: string; label: string }> = {
  emerald: { primary: '158 64% 52%', hi: '156 72% 67%', label: 'Emerald (default)' },
  azure: { primary: '211 92% 60%', hi: '211 96% 74%', label: 'Azure' },
  amber: { primary: '42 96% 55%', hi: '45 96% 70%', label: 'Amber' },
  violet: { primary: '258 90% 68%', hi: '258 92% 78%', label: 'Violet' },
  rose: { primary: '346 84% 62%', hi: '346 90% 74%', label: 'Rose' },
};

export const applyTheme = (name: ThemeName) => {
  const theme = THEMES[name];
  if (!theme) return false;

  const el = document.documentElement;
  el.style.setProperty('--primary', theme.primary);
  el.style.setProperty('--primary-hi', theme.hi);
  el.style.setProperty('--ring', theme.primary);
  return true;
};
