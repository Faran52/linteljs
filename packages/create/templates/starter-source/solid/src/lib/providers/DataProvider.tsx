import type { JSX } from 'solid-js';

export interface DataProviderProps {
  readonly children: JSX.Element;
}

/*
 * The slot a data layer fills. With none there is nothing to provide, so this passes its children through
 * and TanStack Query replaces this file with its own client.
 */
export const DataProvider = (props: DataProviderProps): JSX.Element => {
  // Wrapped rather than returned: reading `props.children` outside JSX reads it once and never again.
  return <>{props.children}</>;
};
