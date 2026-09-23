import { styles } from './styles';

import type { JSX } from 'solid-js';

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
 *
 * The two controls repeat their attributes rather than sharing a spread object: in Solid a shared object is read
 * once unless every member of it is a getter, and eight getters is longer than the two lines they would save.
 */
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
