import { useTranslation } from 'react-i18next';

import { chooseLanguage } from '../../../i18n';
import { languages } from '../../../i18n/config';
import { ROUTES } from '../../../pages/routes';

import { styles } from './styles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
  readonly current: string;
  readonly onNavigate: (page: string) => void;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({
  name,
  current,
  onNavigate,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <header {...styles.header}>
      <p {...styles.starterLabel}>{t('starterLabel')}</p>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {ROUTES
          .map(({ id }) => {
            return (
              <button
                key={id}
                type="button"
                aria-current={id === current ? 'page' : undefined}
                {...styles.tab(id === current)}
                onClick={() => {
                  onNavigate(id);
                }}
              >
                {/* Keyed by route id, so a page added to `ROUTES` needs its own key in every locale. */}
                {t(id)}
              </button>
            );
          })}
      </nav>
      {/* Styled as a tab, so the header keeps one visual language. */}
      <select
        aria-label={t('language')}
        value={i18n.language}
        {...styles.tab(false)}
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
    </header>
  );
};
