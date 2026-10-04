export type ContactKey = keyof typeof CONTACT_TEXT;

export type Translate = (key: ContactKey) => string;

export interface ContactValues {
  email: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactValues, ContactKey>>;

// The form's words by their locale key: a project with languages reads the same keys from its locales.
export const CONTACT_TEXT = {
  contactEmail: 'Email',
  contactMessage: 'Message',
  contactEmailInvalid: 'Enter a valid email address.',
  contactMessageShort: 'Write at least ten characters.',
} as const;

export const isContactKey = (value: unknown): value is ContactKey => {
  return typeof value === 'string' && Object.hasOwn(CONTACT_TEXT, value);
};

// Anything but a rule's key, such as the `String()` of a missing error, shows nothing.
export const errorText = (found: string | undefined, translate: Translate): string | undefined => {
  return isContactKey(found) ? translate(found) : undefined;
};

const MIN_MESSAGE_LENGTH = 10;

export const validateContact = (values: ContactValues): ContactErrors => {
  const errors: ContactErrors = {};

  // Deliberately loose: the only address that matters is one a server accepts, and this is a starter.
  if (!/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/.test(values.email)) {
    errors.email = 'contactEmailInvalid';
  }

  if (values.message.trim().length < MIN_MESSAGE_LENGTH) {
    errors.message = 'contactMessageShort';
  }

  return errors;
};
