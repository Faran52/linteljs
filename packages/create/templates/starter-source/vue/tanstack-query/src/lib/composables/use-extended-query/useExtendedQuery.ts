import { useQuery } from '@tanstack/vue-query';
import {
  type ApiError,
  type QueryValue,
  request,
} from '@utils/fetchExtended';

import type { Ref } from 'vue';

export interface ExtendedQueryOptions {
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly enabled?: boolean;
  readonly staleTime?: number;
}

export interface ExtendedQueryResult<TResponse> {
  readonly response: Ref<TResponse | undefined>;
  readonly error: Ref<ApiError | null>;
  readonly isFetching: Ref<boolean>;
  readonly status: Ref<'error' | 'pending' | 'success'>;
  readonly refetch: () => void;
}

/**
 * A composable, not a hook, which is the word Vue uses and the directory this project keeps them in.
 *
 * Refs come back rather than values, because that is what a Vue template unwraps and what keeps the view reactive;
 * returning `.value` here would hand the caller a snapshot that never updates again. Everything else is the trade
 * the React hook makes for the same reasons: the key is the path and its query, the library's signal is passed
 * down so an unmounted query cancels, and `refetch` answers nothing so no caller has a promise to float.
 */
export const useExtendedQuery = <TResponse>(
  path: string,
  options: ExtendedQueryOptions = {},
): ExtendedQueryResult<TResponse> => {
  const {
    query,
    enabled = true,
    staleTime = 30_000,
  } = options;

  const {
    data,
    error,
    isFetching,
    status,
    refetch,
  } = useQuery<TResponse, ApiError>({
    queryKey: [path, query],
    queryFn: ({ signal }) => {
      return request<TResponse>(path, {
        ...(query === undefined ? {} : { query }),
        signal,
      });
    },
    enabled,
    staleTime,
  });

  return {
    response: data,
    error,
    isFetching,
    status,
    refetch: () => {
      void refetch();
    },
  };
};
