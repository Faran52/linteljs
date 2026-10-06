import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { ROUTES } from '@pages/routes';

import { LanguageSelect } from '../language-select/LanguageSelect';

import { styles } from './appHeaderStyles';

import type { FC } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
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
              <NavLink
                key={id}
                to={path}
                end
                className={({ isActive }) => {
                  return styles.tab(isActive).className;
                }}
                style={({ isActive }) => {
                  return styles.tab(isActive).style;
                }}
              >
                {/* Keyed by route id, so a page added to `ROUTES` needs its own key in every locale. */}
                {t(id)}
              </NavLink>
            );
          })}
      </nav>
      <LanguageSelect {...styles.tab(false)} />
    </header>
  );
};
