import { useTranslation } from 'react-i18next';

import { ROUTES } from '@router/router';

import { LanguageSelect } from '../language-select/LanguageSelect';

import { styles } from './appHeaderStyles';

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
  const { t } = useTranslation();

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
      <LanguageSelect {...styles.tab(false)} />
    </header>
  );
};
