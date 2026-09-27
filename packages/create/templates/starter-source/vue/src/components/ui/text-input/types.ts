// In a module: a `.ts` file cannot import a type from a `.vue` one under this project's lint.
// `error` is required and nullable: a getter cannot be conditionally present under `exactOptionalPropertyTypes`.
export interface TextInputProps {
  id: string;
  label: string;
  value: string;
  error: string | undefined;
  multiline?: boolean;
  type?: 'text' | 'email';
}
