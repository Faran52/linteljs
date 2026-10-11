import { applyStyles } from '@lib/utils/elementUtils';

import { styles } from './textInput.styles';

export interface TextInputOptions {
  readonly id: string;
  readonly label: string;
  readonly error: string | undefined;
  readonly multiline?: boolean;
  readonly type?: 'text' | 'email';
}

// Under `lib/`: a DOM builder is not a component under either naming rule.
export const textInput = ({
  id,
  label,
  error,
  multiline = false,
  type = 'text',
}: TextInputOptions): HTMLDivElement => {
  const invalid = error !== undefined;
  const field = document.createElement('div');
  applyStyles(field, styles.field);

  const labelElement = document.createElement('label');
  applyStyles(labelElement, styles.label);
  labelElement.htmlFor = id;
  labelElement.textContent = label;

  const control = multiline ? document.createElement('textarea') : document.createElement('input');
  applyStyles(control, multiline ? styles.textarea(invalid) : styles.input(invalid));
  control.id = id;
  control.name = id;
  control.setAttribute('aria-invalid', String(invalid));

  if (control instanceof HTMLInputElement) {
    control.type = type;
  }

  field.append(labelElement, control);

  if (invalid) {
    const errorElement = document.createElement('p');
    applyStyles(errorElement, styles.error);
    errorElement.id = `${id}-error`;
    errorElement.textContent = error;
    control.setAttribute('aria-describedby', errorElement.id);
    field.append(errorElement);
  }

  return field;
};
