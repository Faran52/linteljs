import { z } from 'zod';

export type ContactValues = z.input<typeof contactSchema>;

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

export const contactSchema = z.object({
  email: z.email('Enter a valid email address.'),
  message: z.string().trim().min(10, 'Write at least ten characters.'),
});

/*
 * The shape and the rules, apart from the form that binds them and the api that sends them. One schema is the
 * source of both the type and the messages, so a rule is written once and the form and the api agree about it.
 */
export const validateContact = (values: ContactValues): ContactErrors => {
  const parsed = contactSchema.safeParse(values);

  if (parsed.success) {
    return {};
  }

  return Object.fromEntries(parsed.error.issues.map((issue) => {
    return [String(issue.path[0]), issue.message];
  }));
};
