'use client';

import { chooseLanguage } from '@i18n';
import { languages } from '@i18n/config';
import { useLocale, useTranslations } from 'next-intl';

import type { ComponentProps, ReactNode } from 'react';

export type LanguageSelectProps = Pick<ComponentProps<'select'>, 'className' | 'style'>;

// Styled by the header that holds it, so every header keeps one visual language.
export const LanguageSelect = (props: LanguageSelectProps): ReactNode => {
  const t = useTranslations();
  const language = useLocale();

  return (
    <select
      {...props}
      aria-label={t('language')}
      value={language}
      onChange={(event) => {
        chooseLanguage(event.target.value);
      }}
    >
      {languages
        .map(({ id, label }) => {
          return (
            <option
              key={id}
              value={id}
              lang={id}
            >
              {label}
            </option>
          );
        })}
    </select>
  );
};
