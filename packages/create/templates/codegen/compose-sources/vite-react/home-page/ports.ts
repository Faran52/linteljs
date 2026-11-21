import type { TFunction } from 'i18next';
import type { HTMLAttributes } from 'react';

export type Attrs = Pick<HTMLAttributes<HTMLElement>, 'className' | 'style'>;

export interface Sx {
  readonly hero: Attrs;
  readonly title: Attrs;
  readonly lede: Attrs;
  readonly counter: Attrs;
  readonly count: Attrs;
  readonly caption: Attrs;
  readonly hint: Attrs;
}

export interface CounterProps<TSetup> {
  readonly counter: TSetup;
  readonly t: TFunction;
}
