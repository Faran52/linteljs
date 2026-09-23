interface ElementProps {
  readonly class: string;
}

/*
 * The field's styles as props. `input` and `textarea` are functions because invalid is a conditional style, and
 * it is threaded as a value rather than selected on `[aria-invalid="true"]`: StyleX has no attribute selectors,
 * so a stylesheet that reached for one would be a rule the other answer could not express.
 */
export const styles = {
  field: { class: 'field' },
  label: { class: 'label' },
  error: { class: 'error' },

  input: (invalid: boolean): ElementProps => {
    return { class: invalid ? 'input input-invalid' : 'input' };
  },

  textarea: (invalid: boolean): ElementProps => {
    return { class: invalid ? 'textarea textarea-invalid' : 'textarea' };
  },
};
