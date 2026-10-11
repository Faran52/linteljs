import { useQuery } from '@tanstack/solid-query';

import { type ExtendedQueryOptions, extendedQueryOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';
import type { Accessor } from 'solid-js';

export interface ExtendedQueryResult<TResponse> {
  readonly response: Accessor<TResponse | undefined>;
  readonly error: Accessor<ApiError | null>;
  readonly isFetching: Accessor<boolean>;
  readonly status: Accessor<'error' | 'pending' | 'success'>;
  readonly refetch: () => void;
}

// Accessors, not values: Solid tracks a read, so a value read here would never update.
export const createExtendedQuery = <TResponse>(
  path: string,
  options: ExtendedQueryOptions = {},
): ExtendedQueryResult<TResponse> => {
  const result = useQuery<TResponse, ApiError>(() => {
    return extendedQueryOptions<TResponse>(path, options);
  });

  const extendedQuery: ExtendedQueryResult<TResponse> = {
    response: () => {
      return result.data;
    },
    error: () => {
      return result.error;
    },
    isFetching: () => {
      return result.isFetching;
    },
    status: () => {
      return result.status;
    },
    refetch: () => {
      void result.refetch();
    },
  };

  return extendedQuery;
};
