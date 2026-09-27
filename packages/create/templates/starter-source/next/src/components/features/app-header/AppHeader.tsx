'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PAGES } from '../../../config/routes';

import { styles } from './styles';

import type { ReactNode } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

// A client component: `usePathname` marks the current tab, and a server component cannot read it.
export const AppHeader = ({ name }: AppHeaderProps): ReactNode => {
  const pathname = usePathname();

  return (
    <header {...styles.header}>
      <p {...styles.starterLabel}>LintelJS Starter</p>
      <p {...styles.brand}>{name}</p>
      <nav {...styles.tabs} aria-label="Main">
        {PAGES
          .map(({
            id,
            label,
            path,
          }) => {
            return (
              <Link
                key={id}
                {...styles.tab(pathname === path)}
                href={path}
                aria-current={pathname === path ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
      </nav>
    </header>
  );
};
