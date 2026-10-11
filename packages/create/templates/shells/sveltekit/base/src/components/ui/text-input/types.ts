// In a module: a `.ts` file cannot import a type from a `.svelte` one under this project's lint.
// `error` is required and nullable: a getter cannot be conditionally present under `exactOptionalPropertyTypes`.
export interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error: string | undefined;
  multiline?: boolean;
  type?: 'text' | 'email';
}
