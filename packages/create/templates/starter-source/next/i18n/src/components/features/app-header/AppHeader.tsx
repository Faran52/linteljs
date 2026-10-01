'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { PAGES } from '@config/routes';

import { LanguageSelect } from '../language-select/LanguageSelect';

import { styles } from './styles';

import type { ReactNode } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// A client component: `usePathname` marks the current tab, and a server component cannot read it.
export const AppHeader = ({ name }: AppHeaderProps): ReactNode => {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header {...styles.header}>
      <p {...styles.starterLabel}>{t('starterLabel')}</p>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {PAGES
          .map(({ id, path }) => {
            return (
              <Link
                key={id}
                {...styles.tab(pathname === path)}
                href={path}
                aria-current={pathname === path ? 'page' : undefined}
              >
                {/* Keyed by page id, so a page added to `PAGES` needs its own key in every locale. */}
                {t(id)}
              </Link>
            );
          })}
      </nav>
      <LanguageSelect {...styles.tab(false)} />
    </header>
  );
};
