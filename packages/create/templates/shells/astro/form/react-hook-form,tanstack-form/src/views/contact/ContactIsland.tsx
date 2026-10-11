import { type FC, useSyncExternalStore } from 'react';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { fallbackLanguage } from '@i18n/config';

import { ContactPage } from './ContactPage';
import { type ContactCopy, type ContactCopyKey } from './utils/contactCopyUtils';

interface ContactIslandProps {
  readonly copy: ContactCopy;
}

// The language switcher sets `<html lang>`; the island follows it rather than its `[data-i18n]` rewrite.
const onLanguage = (change: () => void): (() => void) => {
  const observer = new MutationObserver(change);

  observer.observe(document.documentElement, { attributeFilter: ['lang'] });

  return () => {
    observer.disconnect();
  };
};

const pageLanguage = (): string => {
  return document.documentElement.lang;
};

const builtLanguage = (): string => {
  return fallbackLanguage;
};

// An island is its own React root, so it brings its provider.
export const ContactIsland: FC<ContactIslandProps> = ({ copy }) => {
  const language = useSyncExternalStore(onLanguage, pageLanguage, builtLanguage);

  const translate = (key: ContactCopyKey): string => {
    return copy[language]?.[key] ?? key;
  };

  return (
    <DataProvider>
      <ContactPage translate={translate} />
    </DataProvider>
  );
};
