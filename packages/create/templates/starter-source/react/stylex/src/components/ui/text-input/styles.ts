import * as stylex from '@stylexjs/stylex';

import { tokens } from '../../../styles/tokens.stylex';

/*
 * The field's styles, beside the component the way its stylesheet was, so under this answer `TextInput.css` does
 * not ship at all.
 *
 * Invalid is passed in rather than selected on `[aria-invalid="true"]`, which StyleX does not support and which
 * it does not need to: a conditional style here is a value the component passes, merged last so it wins.
 */
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

  /*
   * Last in every merge, so it beats the focus colour the way the stylesheet's own ordering did. A border that
   * stayed green while the field read invalid is the bug this ordering exists to stop.
   */
  invalid: { borderColor: tokens.destructive },

  error: {
    margin: 0,
    fontSize: tokens.textBody,
    color: tokens.destructive,
  },
});

export const styles = {
  field: stylex.props(sheet.field),
  label: stylex.props(sheet.label),
  error: stylex.props(sheet.error),

  input: (invalid: boolean): ReturnType<typeof stylex.props> => {
    return stylex.props(sheet.control, invalid && sheet.invalid);
  },

  textarea: (invalid: boolean): ReturnType<typeof stylex.props> => {
    return stylex.props(sheet.control, sheet.textarea, invalid && sheet.invalid);
  },
};
