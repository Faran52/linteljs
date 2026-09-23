import * as stylex from '@stylexjs/stylex';

import { tokens } from '../../../styles/tokens.stylex';

/*
 * The beam never moves. It is the standard, and the lines are what come into line with it. Slow apart and fast
 * back: decay reads as drift and correction reads as the fix, where even timing reads as a jitter.
 *
 * One `@keyframes` for all three, with the distance each line travels held in a custom property the line sets.
 * Three animations would be three copies of the same six frames differing in one number.
 */
const cascade = stylex.keyframes({
  '0%': {
    transform: 'translateX(0)',
    animationTimingFunction: 'ease-in-out',
  },
  '32%': {
    transform: 'translateX(0)',
    animationTimingFunction: 'ease-in-out',
  },
  '58%': { transform: 'translateX(var(--drift))' },
  '70%': {
    transform: 'translateX(var(--drift))',
    animationTimingFunction: 'cubic-bezier(0.3, 1.6, 0.5, 1)',
  },
  '82%': { transform: 'translateX(0)' },
  '100%': { transform: 'translateX(0)' },
});

const sheet = stylex.create({
  mark: {
    width: '148px',
    height: '148px',
    color: tokens.primary,
  },

  line: {
    animationName: cascade,
    animationDuration: '5s',
    animationIterationCount: 'infinite',
  },

  line1: { '--drift': '22px' },

  line2: {
    '--drift': '9px',
    'animationDelay': '0.1s',
  },

  line3: {
    '--drift': '32px',
    'animationDelay': '0.2s',
  },
});

export const styles = {
  mark: stylex.props(sheet.mark),
  line1: stylex.props(sheet.line, sheet.line1),
  line2: stylex.props(sheet.line, sheet.line2),
  line3: stylex.props(sheet.line, sheet.line3),
};
