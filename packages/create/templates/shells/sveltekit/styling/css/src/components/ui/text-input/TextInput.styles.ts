interface ElementProps {
  readonly class: string;
}

export const styles = {
  field: { class: 'field' },
  label: { class: 'label' },
  error: { class: 'error' },

  input: (invalid: boolean): ElementProps => {
    const props = { class: invalid ? 'input input-invalid' : 'input' };

    return props;
  },

  textarea: (invalid: boolean): ElementProps => {
    const props = { class: invalid ? 'textarea textarea-invalid' : 'textarea' };

    return props;
  },
};
