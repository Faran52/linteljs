import { useTranslation } from 'react-i18next';

import { Link } from '@tanstack/react-router';

import { ROUTES } from '@pages/routes';

import { LanguageSelect } from '../language-select/LanguageSelect';

import { styles } from './styles';

import type { AnchorHTMLAttributes, FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  const activeProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
    'aria-current': 'page',
    ...styles.tab(true),
  };

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
