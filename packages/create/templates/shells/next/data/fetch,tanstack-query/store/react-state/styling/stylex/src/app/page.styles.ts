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
});

export const styles = {
  hero: stylex.props(sheet.hero),
  title: stylex.props(sheet.title),
  lede: stylex.props(sheet.lede),
  hint: { className: 'hint' },
};
