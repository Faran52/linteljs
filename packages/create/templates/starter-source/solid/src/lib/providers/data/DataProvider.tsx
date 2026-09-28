import type { JSX } from 'solid-js';

export interface DataProviderProps {
  readonly children: JSX.Element;
}

export const DataProvider = (props: DataProviderProps): JSX.Element => {
  // Wrapped rather than returned: reading `props.children` outside JSX reads it once and never again.
  return <>{props.children}</>;
};
