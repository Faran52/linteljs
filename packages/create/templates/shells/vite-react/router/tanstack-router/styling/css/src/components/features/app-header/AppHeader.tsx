import { useTranslation } from 'react-i18next';

import { Link } from '@tanstack/react-router';

import { ROUTES } from '@router/router';

import { LanguageSelect } from '../language-select/LanguageSelect';

import type { FC } from 'react';

import './AppHeader.css';

export interface AppHeaderProps {
  readonly name: string;
}

// An element that navigates is an anchor; faking one with a button breaks middle-click.
export const AppHeader: FC<AppHeaderProps> = ({ name }) => {
  // Spread, since an interface does not meet the data-* index signature `activeProps` takes.
  const activeProps = { className: 'tab tab-button tab-current' };

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
              <Link
                key={id}
                to={path}
                className="tab tab-button"
                activeProps={activeProps}
              >
                {/* Keyed by route id, so a page added to `ROUTES` needs its own key in every locale. */}
                {t(id)}
              </Link>
            );
          })}
      </nav>
      <LanguageSelect className="tab tab-button" />
    </header>
  );
};
