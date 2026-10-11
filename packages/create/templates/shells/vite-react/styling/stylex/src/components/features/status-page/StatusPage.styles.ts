import * as stylex from '@stylexjs/stylex';

import { tokens } from '@styles/tokens.stylex';

const sheet = stylex.create({
  // The status pages: a crash, a refusal and a path nothing routes.
  status: {
    display: 'grid',
    flex: 1,
    placeContent: 'center',
    justifyItems: 'center',
    padding: '1.5rem',
    textAlign: 'center',
  },

  statusCode: {
    margin: 0,
    fontSize: 'clamp(3.5rem, 12vw, 5.5rem)',
    fontWeight: 700,
    lineHeight: 1,
    color: tokens.foreground,
    letterSpacing: '-0.03em',
  },

  statusMessage: {
    marginTop: '0.875rem',
    marginInline: 0,
    marginBottom: 0,
    fontSize: '1.125rem',
    color: tokens.mutedForeground,
  },

  statusActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '1.5rem',
  },

  statusAction: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '38px',
    paddingBlock: 0,
    paddingInline: '0.9375rem',
    fontSize: tokens.textUi,
    fontWeight: 540,
    color: tokens.primaryForeground,
    textDecoration: 'none',
    backgroundColor: tokens.primary,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: tokens.radiusMd,
  },

  statusActionOutline: {
    color: tokens.foreground,
    backgroundColor: 'transparent',
    borderColor: tokens.border,
  },
});

export const styles = {
  status: stylex.props(sheet.status),
  statusCode: stylex.props(sheet.statusCode),
  statusMessage: stylex.props(sheet.statusMessage),
  statusActions: stylex.props(sheet.statusActions),

  action: (outlined: boolean): ReturnType<typeof stylex.props> => {
    return stylex.props(sheet.statusAction, outlined && sheet.statusActionOutline);
  },
};
