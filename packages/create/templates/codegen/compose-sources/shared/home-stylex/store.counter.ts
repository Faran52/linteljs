import * as stylex from '@stylexjs/stylex';

import { tokens } from '@styles/tokens.stylex';

import type { StyleXStyles } from '@stylexjs/stylex';

export const counterSheet = {
  counter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    alignItems: 'center',
    marginTop: '2rem',
    marginInline: 0,
    marginBottom: '0.625rem',
  },

  // Tabular with a floor on the width, so counting past nine does not move the button under the pointer.
  count: {
    minWidth: '2ch',
    fontFamily: tokens.fontMono,
    fontSize: '2rem',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.1,
    color: tokens.primary,
    textAlign: 'center',
  },

  // A control with no label is a puzzle: this says what the count is for.
  caption: {
    margin: 0,
    fontSize: tokens.textBody,
    color: tokens.faint,
  },
};

export const counterProps = (sheet: Record<keyof typeof counterSheet, StyleXStyles>) => {
  return {
    counter: stylex.props(sheet.counter),
    count: stylex.props(sheet.count),
    caption: stylex.props(sheet.caption),
  };
};
