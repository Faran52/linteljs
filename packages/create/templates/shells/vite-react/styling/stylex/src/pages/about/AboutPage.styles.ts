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

  section: {
    marginBottom: {
      'default': '2.25rem',
      ':last-child': 0,
    },
  },

  sectionTitle: {
    marginTop: 0,
    marginInline: 0,
    marginBottom: '0.75rem',
    fontSize: tokens.textEyebrow,
    fontWeight: 620,
    color: tokens.faint,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },

  rows: {
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },

  // --hair rather than --border: a full rule between every row divides too hard.
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    rowGap: '0.25rem',
    columnGap: '1rem',
    alignItems: 'baseline',
    paddingTop: {
      'default': '0.4375rem',
      ':first-child': 0,
    },
    paddingBottom: '0.4375rem',
    paddingInline: 0,
    borderTopWidth: {
      'default': '1px',
      ':first-child': 0,
    },
    borderTopStyle: 'solid',
    borderTopColor: tokens.hair,
  },

  value: {
    flex: 1,
    minWidth: 0,
    margin: 0,
    fontSize: tokens.textBody,
    color: tokens.mutedForeground,
  },

  key: {
    flex: 'none',
    minWidth: '8rem',
    fontSize: tokens.textUi,
    fontWeight: 540,
  },
});

export const styles = {
  page: stylex.props(sheet.page),
  pageTitle: stylex.props(sheet.pageTitle),
  pageLede: stylex.props(sheet.pageLede),
  section: stylex.props(sheet.section),
  sectionTitle: stylex.props(sheet.sectionTitle),
  rows: stylex.props(sheet.rows),
  row: stylex.props(sheet.row),
  keyCode: { className: 'key-code' },
  value: stylex.props(sheet.value),
  note: { className: 'note' },
  key: stylex.props(sheet.key),
};
