export interface ContactValues {
  email: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

/*
 * The shape and the rules, apart from the form that binds them and the api that sends them. Plain predicates
 * here; answering `zod` replaces this file with a schema and nothing else changes.
 */
export const validateContact = (values: ContactValues): ContactErrors => {
  const errors: ContactErrors = {};

  // Deliberately loose: the only address that matters is one a server accepts, and this is a starter.
  if (!/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (values.message.trim().length < 10) {
    errors.message = 'Write at least ten characters.';
  }

  return errors;
};
