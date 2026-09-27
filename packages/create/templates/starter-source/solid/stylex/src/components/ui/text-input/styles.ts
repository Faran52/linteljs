import * as stylex from '@stylexjs/stylex';

import { tokens } from '../../../styles/tokens.stylex';

// Invalid is passed in: StyleX does not support `[aria-invalid="true"]`.
const sheet = stylex.create({
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    marginBottom: '1rem',
  },

  label: {
    fontSize: tokens.textUi,
    fontWeight: 560,
  },

  control: {
    width: '100%',
    paddingBlock: '0.5rem',
    paddingInline: '0.625rem',
    fontSize: tokens.textUi,
    color: tokens.foreground,
    backgroundColor: tokens.card,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: {
      'default': tokens.input,
      ':focus-visible': 'transparent',
    },
    borderRadius: tokens.radiusMd,
    transitionProperty: 'border-color',
    transitionDuration: tokens.motionFast,
    transitionTimingFunction: tokens.motionEase,
    outlineWidth: {
      'default': 0,
      ':focus-visible': '2px',
    },
    outlineStyle: {
      'default': 'none',
      ':focus-visible': 'solid',
    },
    outlineColor: {
      'default': 'transparent',
      ':focus-visible': tokens.ring,
    },
    outlineOffset: '1px',
  },

  textarea: {
    minHeight: '5.5rem',
    resize: 'vertical',
  },

  // Last in every merge, so it beats the focus colour.
  invalid: { borderColor: tokens.destructive },

  error: {
    margin: 0,
    fontSize: tokens.textBody,
    color: tokens.destructive,
  },
});

export const styles = {
  field: stylex.attrs(sheet.field),
  label: stylex.attrs(sheet.label),
  error: stylex.attrs(sheet.error),

  input: (invalid: boolean): ReturnType<typeof stylex.attrs> => {
    return stylex.attrs(sheet.control, invalid && sheet.invalid);
  },

  textarea: (invalid: boolean): ReturnType<typeof stylex.attrs> => {
    return stylex.attrs(sheet.control, sheet.textarea, invalid && sheet.invalid);
  },
};
