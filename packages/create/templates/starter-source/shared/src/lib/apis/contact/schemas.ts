export interface ContactValues {
  email: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

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
