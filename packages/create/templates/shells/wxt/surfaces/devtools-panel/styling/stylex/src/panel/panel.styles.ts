import * as stylex from '@stylexjs/stylex';

import { tokens } from '@styles/tokens.stylex';

const sheet = stylex.create({
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

  starterLabel: {
    flex: 'none',
    margin: 0,
    fontSize: tokens.textEyebrow,
    fontWeight: 620,
    color: tokens.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },

  // A name is whatever was typed, so it wraps rather than overflowing.
  title: {
    maxWidth: '100%',
    marginBlock: '0.375rem',
    marginInline: 0,
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
});

export const styles = {
  hero: stylex.attrs(sheet.hero),
  starterLabel: stylex.attrs(sheet.starterLabel),
  title: stylex.attrs(sheet.title),
  lede: stylex.attrs(sheet.lede),
};
