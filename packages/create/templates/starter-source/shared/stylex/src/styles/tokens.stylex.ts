import * as stylex from '@stylexjs/stylex';

/*
 * StyleX's names for the tokens, pointed at `tokens.css` rather than given values of their own.
 *
 * Every value is spelled once, in one file, whatever styles this project. `tokens.primary` here, `bg-primary`
 * under Tailwind and `var(--primary)` in a stylesheet are the same colour, so retinting is one edit and no two
 * copies can disagree. A second table of the same thirty values is the drift this repository exists to stop.
 */
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
  dim: 'var(--dim)',
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
