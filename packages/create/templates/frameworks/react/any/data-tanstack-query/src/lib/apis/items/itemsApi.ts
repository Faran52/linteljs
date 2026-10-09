import { useExtendedQuery } from '@hooks/use-extended-query/useExtendedQuery';

export interface Item {
  readonly id: number;
  readonly name: string;
}

export type ItemsState =
  | { readonly status: 'pending' }
  | { readonly status: 'error' }
  | { readonly status: 'success'; readonly items: readonly Item[] };

export const useItems = (): ItemsState => {
  const { response, status } = useExtendedQuery<readonly Item[]>('/items.json');

  if (status === 'error') {
    const failed: ItemsState = { status: 'error' };

    return failed;
  }

  if (response === undefined) {
    const pending: ItemsState = { status: 'pending' };

    return pending;
  }

  const loaded: ItemsState = { status: 'success', items: response };

  return loaded;
};
