import { z } from 'zod';

export type ContactKey = keyof typeof CONTACT_TEXT;

export type Translate = (key: ContactKey) => string;

export type ContactValues = z.input<typeof contactSchema>;

export type ContactErrors = Partial<Record<keyof ContactValues, ContactKey>>;

// Named: an options getter, as Solid and Svelte take them, gives TypeScript no contextual type.
export interface ContactSubmission {
  value: ContactValues;
}

export interface ContactFormErrors {
  fields: ContactErrors;
}

export interface ContactResult {
  status: number;
}

// The form's words by their locale key: a project with languages reads the same keys from its locales.
export const CONTACT_TEXT = {
  contactEmail: 'Email',
  contactMessage: 'Message',
  contactEmailInvalid: 'Enter a valid email address.',
  contactMessageShort: 'Write a message of at least ten characters.',
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

  // An issue's message is a string; the filter narrows it to the key each rule above sets.
  const entries = parsed.error.issues
    .map((issue): [string, string] => {
      const entry: [string, string] = [String(issue.path[0]), issue.message];

      return entry;
    })
    .filter((entry): entry is [string, ContactKey] => {
      return isContactKey(entry[1]);
    });

  return Object.fromEntries(entries);
};

// TanStack Form's form-level validator: the errors per field, or none once every rule passes.
export const validateContactForm = ({ value }: ContactSubmission): ContactFormErrors | undefined => {
  const found = validateContact(value);

  const errors = Object.keys(found).length > 0 ? { fields: found } : undefined;

  return errors;
};

// Local: a starter that posted somewhere would fail offline and in CI.
export const submitContact = async (values: ContactValues): Promise<ContactResult> => {
  const errors = validateContact(values);

  if (Object.keys(errors).length > 0) {
    throw new Error('Contact details are not valid');
  }

  return await Promise.resolve({ status: 200 });
};
