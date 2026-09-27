interface ElementProps {
  readonly class: string;
}

// Invalid is a value, not `[aria-invalid="true"]`: StyleX has no attribute selectors.
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
