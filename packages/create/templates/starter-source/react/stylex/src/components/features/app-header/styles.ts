import * as stylex from '@stylexjs/stylex';

import { tokens } from '../../../styles/tokens.stylex';

// A pseudo-class is a nested object: `default` is the base and the key beside it the condition.
const sheet = stylex.create({
  header: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: '0.75rem',
    paddingInline: '1.125rem',
    backgroundColor: tokens.card,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.border,
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
    paddingBlock: '0.3125rem',
    paddingInline: '0.625rem',
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

  // Passed by the component: StyleX merges by order, so a conditional style is a value, not specificity.
  current: {
    fontWeight: 560,
    color: tokens.primary,
    backgroundColor: tokens.muted,
  },
});

export const styles = {
  header: stylex.props(sheet.header),
  brand: stylex.props(sheet.brand),
  tabs: stylex.props(sheet.tabs),

  tab: (current: boolean): ReturnType<typeof stylex.props> => {
    return stylex.props(sheet.tab, current && sheet.current);
  },
};
