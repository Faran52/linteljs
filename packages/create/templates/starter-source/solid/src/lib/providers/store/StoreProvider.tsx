import type { JSX } from 'solid-js';

export interface StoreProviderProps {
  readonly children: JSX.Element;
}

export const StoreProvider = (props: StoreProviderProps): JSX.Element => {
  // Wrapped rather than returned: reading `props.children` outside JSX reads it once and never again.
  return <>{props.children}</>;
};
