import type { HTMLAttributes, ReactNode } from 'react';

export type Attrs = Pick<HTMLAttributes<HTMLElement>, 'className' | 'style'>;

export interface TabAttrs extends Attrs {
  readonly className: string;
}

export interface Sx {
  readonly header: Attrs;
  readonly starterLabel: Attrs;
  readonly brand: Attrs;
  readonly tabs: Attrs;
  readonly inlineStyle: boolean;
  readonly tab: (active: boolean) => TabAttrs;
}

export interface NavItemProps<TSetup> {
  readonly id: string;
  readonly path: string;
  readonly setup: TSetup;
  readonly children: ReactNode;
}
