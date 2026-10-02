import { useQuery } from '@tanstack/vue-query';

import {
  type ApiError,
  type QueryValue,
  request,
} from '@utils/fetchExtendedUtils';

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

// Refs, not values: `.value` here would hand the caller a snapshot that never updates.
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

  const extendedQuery: ExtendedQueryResult<TResponse> = {
    response: data,
    error,
    isFetching,
    status,
    refetch: () => {
      void refetch();
    },
  };

  return extendedQuery;
};
