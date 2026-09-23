import * as stylex from '@stylexjs/stylex';

import { tokens } from '../../../styles/tokens.stylex';

/*
 * The button's styles, beside the component the way its stylesheet was, and compiled to atomic classes at build
 * time, so under this answer `Button.css` does not ship at all.
 *
 * `:hover` and `:disabled` are two values of one property rather than two rules. The stylesheet needs
 * `:hover:not(:disabled)` to keep a disabled button from lifting under the pointer; here it does not, because
 * StyleX orders `:disabled` after `:hover` and the last matching value wins.
 *
 * `border` and `outline` are written longhand. StyleX refuses a shorthand whose longhand could be set elsewhere
 * and contradict it, which is the whole class of bug that makes CSS specificity worth escaping.
 */
const sheet = stylex.create({
  button: {
    padding: '0.4375rem 0.9375rem',
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
  button: stylex.props(sheet.button),
};
