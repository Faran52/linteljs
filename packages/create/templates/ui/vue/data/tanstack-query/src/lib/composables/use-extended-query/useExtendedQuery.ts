import { useQuery } from '@tanstack/vue-query';

import { type ExtendedQueryOptions, extendedQueryOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';
import type { Ref } from 'vue';

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
    data,
    error,
    isFetching,
    status,
    refetch,
  } = useQuery<TResponse, ApiError>(extendedQueryOptions<TResponse>(path, options));

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
