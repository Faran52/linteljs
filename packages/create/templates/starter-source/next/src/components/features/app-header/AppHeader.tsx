'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PAGES } from '../../../config/routes';

import { styles } from './styles';

import type { ReactNode } from 'react';

export interface AppHeaderProps {
  readonly name: string;
}

/*
 * A client component, and the only one the layout needs of its own: `usePathname` is what marks the tab you are
 * on, and a server component cannot read it. The tabs are `next/link`, which is what prefetches a route and keeps
 * the address bar honest.
 */
export const AppHeader = ({ name }: AppHeaderProps): ReactNode => {
  const pathname = usePathname();

  return (
    <header {...styles.header}>
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
