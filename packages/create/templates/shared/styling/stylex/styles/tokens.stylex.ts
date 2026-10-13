import * as stylex from '@stylexjs/stylex';

// Pointed at `tokens.css`, so every value is spelled once whatever styles this project.
export const tokens = stylex.defineVars({
  motionFast: 'var(--motion-fast)',
  motionEase: 'var(--motion-ease)',

  background: 'var(--background)',
  card: 'var(--card)',
  foreground: 'var(--foreground)',
  foreground2: 'var(--foreground-2)',
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  faint: 'var(--faint)',
  border: 'var(--border)',
  hair: 'var(--hair)',
  input: 'var(--input)',

  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  ring: 'var(--ring)',
  ok: 'var(--ok)',
  destructive: 'var(--destructive)',

  radiusXs: 'var(--radius-xs)',
  radiusSm: 'var(--radius-sm)',
  radiusMd: 'var(--radius-md)',
  radiusLg: 'var(--radius-lg)',
  radiusXl: 'var(--radius-xl)',

  fontSans: 'var(--font-sans)',
  fontMono: 'var(--font-mono)',
  textEyebrow: 'var(--text-eyebrow)',
  textBody: 'var(--text-body)',
  textUi: 'var(--text-ui)',
  textValue: 'var(--text-value)',
  textMetric: 'var(--text-metric)',
});
