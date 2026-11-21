import { useTranslation } from 'react-i18next';

import { ROUTES } from '@router/router';

import { LanguageSelect } from '../language-select/LanguageSelect';

import { NavItem, useNavSetup } from './router';
import { sx } from './styling';

import type { RouterProps } from './router';
import type { FC } from 'react';

export interface AppHeaderProps extends RouterProps {
  readonly name: string;
}

// @lintel:comment ./router#headerComment
export const AppHeader: FC<AppHeaderProps> = ({ name, ...routerProps }) => {
  const setup = useNavSetup();

  const { t } = useTranslation();

  return (
    <header {...sx.header}>
      <p {...sx.starterLabel}>{t('starterLabel')}</p>
      <p {...sx.brand}>{name}</p>
      <nav {...sx.tabs} aria-label="Main">
        {ROUTES
          .map(({
            id,
            path,
          }) => {
            return (
              <NavItem
                key={id}
                id={id}
                path={path}
                setup={setup}
                {...routerProps}
              >
                {/* Keyed by route id, so a page added to `ROUTES` needs its own key in every locale. */}
                {t(id)}
              </NavItem>
            );
          })}
      </nav>
      <LanguageSelect {...sx.tab(false)} />
    </header>
  );
};
