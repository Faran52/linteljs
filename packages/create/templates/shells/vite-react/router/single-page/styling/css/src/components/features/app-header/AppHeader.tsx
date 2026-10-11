import { useTranslation } from 'react-i18next';

import { ROUTES } from '@router/router';

import { LanguageSelect } from '../language-select/LanguageSelect';

import type { FC } from 'react';

import './AppHeader.css';

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
    <header className="header">
      <p className="starter-label">{t('starterLabel')}</p>
      <p className="brand">{name}</p>
      <nav className="tabs" aria-label="Main">
        {ROUTES
          .map(({ id }) => {
            return (
              <button
                key={id}
                type="button"
                aria-current={id === current ? 'page' : undefined}
                className={id === current ? 'tab tab-button tab-current' : 'tab tab-button'}
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
      <LanguageSelect className="tab tab-button" />
    </header>
  );
};
