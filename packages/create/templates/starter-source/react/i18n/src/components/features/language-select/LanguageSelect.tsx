import { useTranslation } from 'react-i18next';

import { chooseLanguage } from '../../../i18n';
import { languages } from '../../../i18n/config';

import type { ComponentProps, FC } from 'react';

export type LanguageSelectProps = Pick<ComponentProps<'select'>, 'className' | 'style'>;

// Styled by the header that holds it, so every header keeps one visual language.
export const LanguageSelect: FC<LanguageSelectProps> = (props) => {
  const { t, i18n } = useTranslation();

  return (
    <select
      {...props}
      aria-label={t('language')}
      value={i18n.language}
      onChange={(event) => {
        void chooseLanguage(event.target.value);
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
