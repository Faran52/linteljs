interface ElementProps {
  readonly className: string;
}

/*
 * The field's styles as props. `input` and `textarea` are functions because invalid is a conditional style, and
 * it is threaded as a value rather than selected on `[aria-invalid="true"]`: StyleX has no attribute selectors,
 * so a stylesheet that reached for one would be a rule the other answer could not express.
 */
export const styles = {
  field: { className: 'field' },
  label: { className: 'label' },
  error: { className: 'error' },

  input: (invalid: boolean): ElementProps => {
    return { className: invalid ? 'input input-invalid' : 'input' };
  },

  textarea: (invalid: boolean): ElementProps => {
    return { className: invalid ? 'textarea textarea-invalid' : 'textarea' };
  },
};
