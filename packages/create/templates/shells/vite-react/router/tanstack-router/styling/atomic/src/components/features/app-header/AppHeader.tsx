import { useTranslation } from 'react-i18next';

import { Link } from '@tanstack/react-router';

import { ROUTES } from '@router/router';

import { LanguageSelect } from '../language-select/LanguageSelect';

import { styles } from './AppHeader.styles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  // Spread, since an interface does not meet the data-* index signature `activeProps` takes.
  const activeProps = { ...styles.tab(true) };

  const { t } = useTranslation();

  return (
    <header {...styles.header}>
      <p {...styles.starterLabel}>{t('starterLabel')}</p>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {ROUTES
          .map(({
            id,
            path,
          }) => {
            return (
              <Link
                key={id}
                to={path}
                {...styles.tab(false)}
                activeProps={activeProps}
              >
                {/* Keyed by route id, so a page added to `ROUTES` needs its own key in every locale. */}
                {t(id)}
              </Link>
            );
          })}
      </nav>
      <LanguageSelect {...styles.tab(false)} />
    </header>
  );
};
