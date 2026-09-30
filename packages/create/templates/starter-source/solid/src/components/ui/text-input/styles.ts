interface ElementProps {
  readonly class: string;
}

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
