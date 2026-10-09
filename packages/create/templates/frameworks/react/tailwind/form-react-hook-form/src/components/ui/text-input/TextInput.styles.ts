interface ElementProps {
  readonly className: string;
}

export const styles = {
  field: { className: 'field' },
  label: { className: 'label' },
  error: { className: 'error' },

  input: (invalid: boolean): ElementProps => {
    const props = { className: invalid ? 'input input-invalid' : 'input' };

    return props;
  },

  textarea: (invalid: boolean): ElementProps => {
    const props = { className: invalid ? 'textarea textarea-invalid' : 'textarea' };

    return props;
  },
};
