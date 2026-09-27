import * as stylex from '@stylexjs/stylex';

import { tokens } from '../../../styles/tokens.stylex';

// StyleX orders `:disabled` after `:hover`, so no `:not(:disabled)`.
// Longhand: StyleX refuses a shorthand a longhand elsewhere could contradict.
const sheet = stylex.create({
  button: {
    paddingBlock: '0.4375rem',
    paddingInline: '0.9375rem',
    fontSize: tokens.textUi,
    fontWeight: 540,
    color: tokens.primaryForeground,
    cursor: {
      'default': 'pointer',
      ':disabled': 'not-allowed',
    },
    backgroundColor: tokens.primary,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: tokens.radiusMd,
    opacity: {
      'default': 1,
      ':hover': 0.88,
      ':disabled': 0.45,
    },
    transitionProperty: 'opacity',
    transitionDuration: tokens.motionFast,
    transitionTimingFunction: tokens.motionEase,
    outlineWidth: {
      'default': 0,
      ':focus-visible': '2px',
    },
    outlineStyle: {
      'default': 'none',
      ':focus-visible': 'solid',
    },
    outlineColor: {
      'default': 'transparent',
      ':focus-visible': tokens.ring,
    },
    outlineOffset: '2px',
  },
});

export const styles = {
  button: stylex.attrs(sheet.button),
};
