import { useQuery } from '@tanstack/solid-query';
import {
  type ApiError,
  type QueryValue,
  request,
} from '@utils/fetchExtended';

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

/**
 * A primitive, not a hook, which is Solid's word and the directory this project keeps them in.
 *
 * Accessors come back rather than values, because Solid tracks a read rather than a render: returning the value
 * here would read it once, outside any tracking scope, and nothing would ever update again. The options are
 * passed as a function for the same reason, which is what lets a changing `enabled` or query be followed.
 */
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
