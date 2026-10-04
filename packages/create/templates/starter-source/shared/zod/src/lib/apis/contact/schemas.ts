import { z } from 'zod';

export type ContactKey = keyof typeof CONTACT_TEXT;

export type Translate = (key: ContactKey) => string;

export type ContactValues = z.input<typeof contactSchema>;

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

export const contactSchema = z.object({
  email: z.email('contactEmailInvalid' satisfies ContactKey),
  message: z.string()
    .trim()
    .min(MIN_MESSAGE_LENGTH, 'contactMessageShort' satisfies ContactKey),
});

export const validateContact = (values: ContactValues): ContactErrors => {
  const parsed = contactSchema.safeParse(values);

  if (parsed.success) {
    return {};
  }

  const entries = parsed.error.issues
    .flatMap((issue) => {
      const field = String(issue.path[0]);
      const entry: [string, ContactKey][] = isContactKey(issue.message) ? [[field, issue.message]] : [];

      return entry;
    });

  return Object.fromEntries(entries);
};
