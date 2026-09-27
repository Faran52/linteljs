interface ElementProps {
  readonly className: string;
}

// Invalid is a value, not `[aria-invalid="true"]`: StyleX has no attribute selectors.
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
