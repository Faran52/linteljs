import * as stylex from '@stylexjs/stylex';

import { tokens } from '@styles/tokens.stylex';

// A pseudo-class is a nested object: `default` is the base and the key beside it the condition.
const sheet = stylex.create({
  header: {
    display: 'flex',
    flexWrap: 'wrap',
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

  // Below 30rem the label and a four-tab nav do not fit beside the name, and the label is the one to go.
  starterLabel: {
    display: {
      'default': null,
      '@media (width < 30rem)': 'none',
    },
    flex: 'none',
    margin: 0,
    fontSize: tokens.textEyebrow,
    fontWeight: 620,
    color: tokens.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },

  // The name is whatever was typed: one too long for the row sends the nav below it and wraps, never truncates.
  brand: {
    flex: 'auto',
    minWidth: 0,
    margin: 0,
    fontSize: tokens.textUi,
    fontWeight: 600,
    overflowWrap: 'anywhere',
    letterSpacing: '-0.01em',
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
  starterLabel: stylex.props(sheet.starterLabel),
  brand: stylex.props(sheet.brand),
  tabs: stylex.props(sheet.tabs),

  tab: (current: boolean): ReturnType<typeof stylex.props> => {
    return stylex.props(sheet.tab, current && sheet.current);
  },
};
