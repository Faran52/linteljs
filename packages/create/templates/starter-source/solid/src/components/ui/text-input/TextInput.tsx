import { styles } from './textInputStyles';

import type { JSX } from 'solid-js';

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

// Attributes repeated: a shared spread object is read once in Solid unless every member is a getter.
export const TextInput = (props: TextInputProps): JSX.Element => {
  const describedBy = (): string | undefined => {
    return props.error === undefined ? undefined : `${props.id}-error`;
  };

  return (
    <div {...styles.field}>
      <label {...styles.label} for={props.id}>{props.label}</label>
      {props.multiline === true
        ? (
            <textarea
              {...styles.textarea(props.error !== undefined)}
              id={props.id}
              name={props.id}
              value={props.value}
              aria-invalid={props.error !== undefined}
              aria-describedby={describedBy()}
              onBlur={() => {
                props.onBlur?.();
              }}
              onInput={(event) => {
                props.onChange(event.currentTarget.value);
              }}
            />
          )
        : (
            <input
              {...styles.input(props.error !== undefined)}
              id={props.id}
              name={props.id}
              type={props.type ?? 'text'}
              value={props.value}
              aria-invalid={props.error !== undefined}
              aria-describedby={describedBy()}
              onBlur={() => {
                props.onBlur?.();
              }}
              onInput={(event) => {
                props.onChange(event.currentTarget.value);
              }}
            />
          )}
      {props.error === undefined ? null : <p {...styles.error} id={`${props.id}-error`}>{props.error}</p>}
    </div>
  );
};
