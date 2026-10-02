import { z } from 'zod';

export type ContactValues = z.input<typeof contactSchema>;

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

const MIN_MESSAGE_LENGTH = 10;

export const contactSchema = z.object({
  email: z.email('Enter a valid email address.'),
  message: z.string()
    .trim()
    .min(MIN_MESSAGE_LENGTH, 'Write at least ten characters.'),
});

export const validateContact = (values: ContactValues): ContactErrors => {
  const parsed = contactSchema.safeParse(values);

  if (parsed.success) {
    return {};
  }

  const entries = parsed.error.issues
    .map((issue) => {
      const field = String(issue.path[0]);
      const entry: [string, string] = [field, issue.message];

      return entry;
    });

  return Object.fromEntries(entries);
};
