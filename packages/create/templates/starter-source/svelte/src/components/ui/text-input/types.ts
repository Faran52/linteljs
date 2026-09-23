/*
 * The control's props, in a module rather than in the component beside it. A `.ts` file cannot import a type from
 * a `.svelte` one: the compiler this project's lint and typecheck run has no parser for a component, so the import
 * resolves to `any` and every read through it is unsafe. The component takes its props from here instead.
 */
/*
 * `error` is required and nullable rather than optional. A binding builds these from a form, where the message has
 * to be a getter to stay reactive, and a getter cannot be conditionally present; under
 * `exactOptionalPropertyTypes` a property that is there holding `undefined` is not an optional one.
 */
export interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error: string | undefined;
  // One control for both, since what is worth sharing is the label and the error around it.
  multiline?: boolean;
  type?: 'text' | 'email';
}
