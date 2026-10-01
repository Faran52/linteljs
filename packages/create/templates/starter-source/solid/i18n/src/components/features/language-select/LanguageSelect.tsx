import { For, type JSX } from 'solid-js';

import {
  chooseLanguage,
  language,
  t,
} from '../../../i18n';
import { languages } from '../../../i18n/config';

export type LanguageSelectProps = Pick<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'class' | 'style'>;

// Styled by the header that holds it, so every header keeps one visual language.
export const LanguageSelect = (props: LanguageSelectProps): JSX.Element => {
  return (
    <select
      {...props}
      aria-label={t('language')}
      value={language()}
      onChange={(event) => {
        chooseLanguage(event.currentTarget.value);
      }}
    >
      <For each={languages}>
        {(option) => {
          return (
            <option value={option.id} lang={option.id}>
              {option.label}
            </option>
          );
        }}
      </For>
    </select>
  );
};
