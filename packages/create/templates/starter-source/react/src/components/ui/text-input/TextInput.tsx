import { styles } from './styles';

import type { FC } from 'react';

/*
 * `error` is required and nullable rather than optional. A binding builds these from a form, where the message has
 * to be a getter to stay reactive, and a getter cannot be conditionally present; under
 * `exactOptionalPropertyTypes` a property that is there holding `undefined` is not an optional one.
 */
export interface TextInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
  readonly error: string | undefined;
  // One control for both, since what is worth sharing is the label and the error around it.
  readonly multiline?: boolean;
  readonly type?: 'text' | 'email';
}

/*
 * The label is visible and bound with `for`, and the error is wired with `aria-describedby`. A dense tool pane can
 * get away with `aria-label` alone; a form cannot.
 */
export const TextInput: FC<TextInputProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  multiline = false,
  type = 'text',
}) => {
  const invalid = error !== undefined;
  const shared = {
    'id': id,
    'name': id,
    value,
    'aria-invalid': invalid,
    'aria-describedby': invalid ? `${id}-error` : undefined,
    onBlur,
  };

  return (
    <div {...styles.field}>
      <label {...styles.label} htmlFor={id}>{label}</label>
      {multiline
        ? (
            <textarea
              {...shared}
              {...styles.textarea(invalid)}
              onChange={(event) => {
                onChange(event.target.value);
              }}
            />
          )
        : (
            <input
              {...shared}
              {...styles.input(invalid)}
              type={type}
              onChange={(event) => {
                onChange(event.target.value);
              }}
            />
          )}
      {invalid ? <p {...styles.error} id={`${id}-error`}>{error}</p> : null}
    </div>
  );
};
