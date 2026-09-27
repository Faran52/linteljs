import { styles } from './styles';

import type { FC } from 'react';

// Required and nullable: a getter cannot be conditionally present under `exactOptionalPropertyTypes`.
export interface TextInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
  readonly error: string | undefined;
  readonly multiline?: boolean;
  readonly type?: 'text' | 'email';
}

// A dense tool pane can get away with `aria-label` alone; a form cannot.
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
