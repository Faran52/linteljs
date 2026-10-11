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

  // An extension page has no header, so the label sits over the title and takes the mark's gap.
  starterLabel: {
    flex: 'none',
    marginTop: '1.625rem',
    marginInline: 0,
    marginBottom: 0,
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

  hint: {
    marginTop: '1.625rem',
    marginInline: 0,
    marginBottom: 0,
    fontSize: tokens.textBody,
    color: tokens.faint,
  },

  hintCode: {
    color: tokens.primary,
  },

  // Drawn as every web header's language select.
  picker: {
    minHeight: '2.75rem',
    paddingBlock: '0.3125rem',
    paddingInline: '0.625rem',
    marginTop: '1rem',
    fontSize: tokens.textUi,
    color: {
      'default': tokens.mutedForeground,
      ':hover': tokens.foreground,
    },
    cursor: 'pointer',
    backgroundColor: {
      'default': 'transparent',
      ':hover': tokens.muted,
    },
    borderStyle: 'none',
    borderRadius: tokens.radiusMd,
    transitionProperty: 'color, background-color',
    transitionDuration: tokens.motionFast,
    transitionTimingFunction: tokens.motionEase,
  },
});

export const styles = {
  hero: stylex.attrs(sheet.hero),
  starterLabel: stylex.attrs(sheet.starterLabel),
  title: stylex.attrs(sheet.title),
  lede: stylex.attrs(sheet.lede),
  hint: stylex.attrs(sheet.hint),
  hintCode: stylex.attrs(sheet.hintCode),
  picker: stylex.attrs(sheet.picker),
};
