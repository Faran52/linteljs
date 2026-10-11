import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { ROUTES } from '@router/router';

import { LanguageSelect } from '../language-select/LanguageSelect';

import type { FC } from 'react';

import './AppHeader.css';

export interface AppHeaderProps {
  readonly name: string;
}

export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <header className="header">
      <p className="starter-label">{t('starterLabel')}</p>
      <p className="brand">{name}</p>
      <nav className="tabs" aria-label="Main">
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
                  return isActive ? 'tab tab-button tab-current' : 'tab tab-button';
                }}
              >
                {/* Keyed by route id, so a page added to `ROUTES` needs its own key in every locale. */}
                {t(id)}
              </NavLink>
            );
          })}
      </nav>
      <LanguageSelect className="tab tab-button" />
    </header>
  );
};
