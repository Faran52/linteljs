import { sx } from './styling';

import type { NavItemProps } from './ports';
import type { FC } from 'react';

export const headerComment = 'An element that navigates is an anchor; faking one with a button breaks middle-click.';

export interface RouterProps {
  readonly current: string;
  readonly onNavigate: (page: string) => void;
}

export const useNavSetup = (): Record<never, never> => {
  return {};
};

export const NavItem: FC<NavItemProps<Record<never, never>> & RouterProps> = ({ id, current, onNavigate, children }) => {
  return (
    <button
      type="button"
      aria-current={id === current ? 'page' : undefined}
      {...sx.tab(id === current)}
      onClick={() => {
        onNavigate(id);
      }}
    >
      {children}
    </button>
  );
};
