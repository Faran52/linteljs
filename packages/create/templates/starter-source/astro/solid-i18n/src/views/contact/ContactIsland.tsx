import {
  createSignal,
  type JSX,
  onCleanup,
  onMount,
} from 'solid-js';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { fallbackLanguage } from '@i18n/config';

import { ContactPage } from './ContactPage';
import { type ContactCopy, type ContactCopyKey } from './utils/contactCopyUtils';

interface ContactIslandProps {
  readonly copy: ContactCopy;
}

// An island is its own Solid root, so it brings its provider.
export const ContactIsland = (props: ContactIslandProps): JSX.Element => {
  // The build language until mounted, so hydration matches; then `<html lang>`, which the switcher sets.
  const [language, setLanguage] = createSignal<string>(fallbackLanguage);

  onMount(() => {
    const follow = (): void => {
      setLanguage(document.documentElement.lang);
    };

    const observer = new MutationObserver(follow);

    follow();

    observer.observe(document.documentElement, { attributeFilter: ['lang'] });

    onCleanup(() => {
      observer.disconnect();
    });
  });

  const translate = (key: ContactCopyKey): string => {
    return props.copy[language()]?.[key] ?? key;
  };

  return (
    <DataProvider>
      <ContactPage translate={translate} />
    </DataProvider>
  );
};
