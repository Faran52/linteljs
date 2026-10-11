import { languages } from '@i18n/config';
import { t } from '@i18n/i18n';

export type ContactCopyKey = (typeof CONTACT_COPY_KEYS)[number];

// Each language's contact words by key, read at build time so the island ships no locale files.
export type ContactCopy = Readonly<Record<string, Readonly<Record<string, string>>>>;

const CONTACT_COPY_KEYS = [
  'contact',
  'contactLede',
  'contactSent',
  'contactSend',
  'contactEmail',
  'contactMessage',
  'contactEmailInvalid',
  'contactMessageShort',
] as const;

export const contactCopy = (): ContactCopy => {
  const entries = languages
    .map(({ id }) => {
      const words = CONTACT_COPY_KEYS
        .map((key) => {
          const word: [string, string] = [key, t(key, undefined, id)];

          return word;
        });
      const entry: [string, Record<string, string>] = [id, Object.fromEntries(words)];

      return entry;
    });

  return Object.fromEntries(entries);
};
