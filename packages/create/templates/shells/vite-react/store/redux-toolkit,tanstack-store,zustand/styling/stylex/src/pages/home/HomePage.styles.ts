import * as stylex from '@stylexjs/stylex';

import { tokens } from '@styles/tokens.stylex';

const sheet = stylex.create({
  // The 360px floor is what an extension popup gives you.
  hero: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '3rem',
    paddingInline: '1.25rem',
    paddingBottom: '4rem',
    textAlign: 'center',
  },

  // A name is whatever was typed, so it wraps rather than overflowing.
  title: {
    maxWidth: '100%',
    marginTop: '1.625rem',
    marginInline: 0,
    marginBottom: '0.375rem',
    fontSize: '1.875rem',
    fontWeight: 620,
    letterSpacing: '-0.025em',
    textWrap: 'balance',
    overflowWrap: 'anywhere',
  },

  lede: {
    maxWidth: '23rem',
    margin: 0,
    fontSize: tokens.textValue,
    color: tokens.mutedForeground,
  },

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
});

export const styles = {
  hero: stylex.props(sheet.hero),
  title: stylex.props(sheet.title),
  lede: stylex.props(sheet.lede),
  counter: stylex.props(sheet.counter),
  count: stylex.props(sheet.count),
  caption: stylex.props(sheet.caption),
  hint: { className: 'hint' },
};
