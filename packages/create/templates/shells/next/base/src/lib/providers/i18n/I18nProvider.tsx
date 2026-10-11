'use client';

import {
  type ReactNode,
  useEffect,
  useSyncExternalStore,
} from 'react';

import { NextIntlClientProvider } from 'next-intl';

import { fallbackLanguage, resources } from '@i18n/config';
import {
  applyDocumentDirection,
  detectLanguage,
  type Language,
  subscribeLanguage,
} from '@i18n/i18n';

export interface I18nProviderProps {
  readonly children: ReactNode;
  // What the server detected from the request, so hydration renders what it rendered.
  readonly language?: Language;
}

export const I18nProvider = ({ children, language: initial = fallbackLanguage }: I18nProviderProps): ReactNode => {
  const language = useSyncExternalStore(subscribeLanguage, () => {
    return detectLanguage();
  }, () => {
    return initial;
  });

  useEffect(() => {
    applyDocumentDirection(language);
  }, [language]);

  return (
    <NextIntlClientProvider locale={language} messages={resources[language].common}>
      {children}
    </NextIntlClientProvider>
  );
};
