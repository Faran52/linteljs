import { baseApi } from '@apis/base/baseApi';

export interface Item {
  readonly id: number;
  readonly name: string;
}

export type ItemsState =
  | { readonly status: 'pending' }
  | { readonly status: 'error' }
  | { readonly status: 'success'; readonly items: readonly Item[] };

const itemsApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const endpoints = {
      items: build.query<readonly Item[], undefined>({
        query: () => {
          return '/items.json';
        },
      }),
    };

    return endpoints;
  },
});

export const useItems = (): ItemsState => {
  const { data, isError } = itemsApi.useItemsQuery(undefined);

  if (isError) {
    const failed: ItemsState = { status: 'error' };

    return failed;
  }

  if (data === undefined) {
    const pending: ItemsState = { status: 'pending' };

    return pending;
  }

  const loaded: ItemsState = { status: 'success', items: data };

  return loaded;
};
