'use client';

import {
  type ReactNode,
  useEffect,
  useSyncExternalStore,
} from 'react';

import {
  applyDocumentDirection,
  detectLanguage,
  subscribeLanguage,
} from '@i18n';
import { fallbackLanguage, resources } from '@i18n/config';
import { NextIntlClientProvider } from 'next-intl';

export interface I18nProviderProps {
  readonly children: ReactNode;
}

const serverLanguage = (): typeof fallbackLanguage => {
  return fallbackLanguage;
};

// The server has neither the reader's storage nor their browser, so it renders English and the client
// switches once hydrated, which React does without a mismatch.
export const I18nProvider = ({ children }: I18nProviderProps): ReactNode => {
  const language = useSyncExternalStore(subscribeLanguage, detectLanguage, serverLanguage);

  useEffect(() => {
    applyDocumentDirection(language);
  }, [language]);

  return (
    <NextIntlClientProvider locale={language} messages={resources[language].common}>
      {children}
    </NextIntlClientProvider>
  );
};
