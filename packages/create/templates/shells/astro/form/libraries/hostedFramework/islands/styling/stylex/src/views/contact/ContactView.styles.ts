import * as stylex from '@stylexjs/stylex';

import { tokens } from '@styles/tokens.stylex';

const sheet = stylex.create({
  page: {
    maxWidth: '27rem',
    paddingTop: '3.25rem',
    paddingInline: '1.25rem',
    paddingBottom: '4rem',
    marginBlock: 0,
    marginInline: 'auto',
  },

  pageTitle: {
    marginTop: 0,
    marginInline: 0,
    marginBottom: '0.3125rem',
    fontSize: tokens.textMetric,
    fontWeight: 620,
    letterSpacing: '-0.015em',
  },

  pageLede: {
    marginTop: 0,
    marginInline: 0,
    marginBottom: '2.25rem',
    fontSize: tokens.textValue,
    color: tokens.mutedForeground,
  },

  sent: {
    padding: '1rem',
    margin: 0,
    fontSize: tokens.textValue,
    color: tokens.ok,
    backgroundColor: tokens.card,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
  },
});

export const styles = {
  page: stylex.props(sheet.page),
  pageTitle: stylex.props(sheet.pageTitle),
  pageLede: stylex.props(sheet.pageLede),
  sent: stylex.props(sheet.sent),
};
