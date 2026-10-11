'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { PAGES } from '@config/routes';

import { LanguageSelect } from '../language-select/LanguageSelect';

import type { ReactNode } from 'react';

import './AppHeader.css';

export interface AppHeaderProps {
  readonly name: string;
}

// A client component: `usePathname` marks the current tab, and a server component cannot read it.
export const AppHeader = ({ name }: AppHeaderProps): ReactNode => {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header className="header">
      <p className="starter-label">{t('starterLabel')}</p>
      <p className="brand">{name}</p>
      <nav className="tabs" aria-label="Main">
        {PAGES
          .map(({ id, path }) => {
            return (
              <Link
                key={id}
                className={pathname === path ? 'tab tab-button tab-current' : 'tab tab-button'}
                href={path}
                aria-current={pathname === path ? 'page' : undefined}
              >
                {/* Keyed by page id, so a page added to `PAGES` needs its own key in every locale. */}
                {t(id)}
              </Link>
            );
          })}
      </nav>
      <LanguageSelect className="tab tab-button" />
    </header>
  );
};
