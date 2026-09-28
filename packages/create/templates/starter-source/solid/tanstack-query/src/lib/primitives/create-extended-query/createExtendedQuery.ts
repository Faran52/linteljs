import { useQuery } from '@tanstack/solid-query';
import {
  type ApiError,
  type QueryValue,
  request,
} from '@utils/fetchExtendedUtils';

import type { Accessor } from 'solid-js';

export interface ExtendedQueryOptions {
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly enabled?: boolean;
  readonly staleTime?: number;
}

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
  const {
    query,
    enabled = true,
    staleTime = 30_000,
  } = options;

  const result = useQuery<TResponse, ApiError>(() => {
    return {
      queryKey: [path, query],
      queryFn: ({ signal }) => {
        return request<TResponse>(path, {
          ...(query === undefined ? {} : { query }),
          signal,
        });
      },
      enabled,
      staleTime,
    };
  });

  return {
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
};
