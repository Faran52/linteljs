import type { JSX } from 'solid-js';

export interface StoreProviderProps {
  readonly children: JSX.Element;
}

/*
 * The slot a store fills. The one store this target offers needs no provider, so this passes its children through
 * and a project that adds one that does replaces this file alone.
 */
export const StoreProvider = (props: StoreProviderProps): JSX.Element => {
  // Wrapped rather than returned: reading `props.children` outside JSX reads it once and never again.
  return <>{props.children}</>;
};
