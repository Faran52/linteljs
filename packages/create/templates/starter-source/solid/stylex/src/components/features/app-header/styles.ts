import * as stylex from '@stylexjs/stylex';

import { tokens } from '../../../styles/tokens.stylex';

/*
 * The header's styles, beside the component the way its stylesheet was. Compiled to atomic classes at build time,
 * so under this answer `AppHeader.css` does not ship at all.
 *
 * Every value comes from `tokens.stylex.ts`, which points at the same custom properties the plain CSS answer
 * reads, so `tokens.primary` here and `var(--primary)` there are one colour and retinting stays one edit.
 *
 * A pseudo-class is a nested object rather than a second rule, which is how StyleX spells a conditional value:
 * `default` is the base and the key beside it is the condition.
 */
const sheet = stylex.create({
  header: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.125rem',
    backgroundColor: tokens.card,
    borderBottom: `1px solid ${tokens.border}`,
  },

  // The name is whatever was typed, so it truncates rather than pushing the nav off.
  brand: {
    minWidth: 0,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: tokens.textUi,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },

  tabs: {
    display: 'flex',
    flex: 'none',
    gap: '0.125rem',
  },

  tab: {
    padding: '0.3125rem 0.625rem',
    fontSize: tokens.textUi,
    color: {
      'default': tokens.mutedForeground,
      ':hover': tokens.foreground,
    },
    textDecoration: 'none',
    borderRadius: tokens.radiusMd,
    backgroundColor: {
      'default': 'transparent',
      ':hover': tokens.muted,
    },
    transitionProperty: 'color, background-color',
    transitionDuration: tokens.motionFast,
    transitionTimingFunction: tokens.motionEase,
    cursor: 'pointer',
    borderStyle: 'none',
  },

  /*
   * Passed by the component rather than selected on the attribute. StyleX merges by order and the last value
   * wins, which is what makes a conditional style a value here instead of a specificity contest.
   */
  current: {
    fontWeight: 560,
    color: tokens.primary,
    backgroundColor: tokens.muted,
  },
});

export const styles = {
  header: stylex.attrs(sheet.header),
  brand: stylex.attrs(sheet.brand),
  tabs: stylex.attrs(sheet.tabs),

  tab: (current: boolean): ReturnType<typeof stylex.attrs> => {
    return stylex.attrs(sheet.tab, current && sheet.current);
  },
};
