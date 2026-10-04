import { useQuery } from '@tanstack/react-query';

import { type ExtendedQueryOptions, extendedQueryOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';

export interface ExtendedQueryResult<TResponse> {
  readonly response: TResponse | undefined;
  readonly error: ApiError | null;
  readonly isFetching: boolean;
  readonly status: 'error' | 'pending' | 'success';
  readonly refetch: () => void;
}

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
    // The library defaults the error to `Error`, and a caller wants the status the adapter put on it.
  } = useQuery<TResponse, ApiError>(extendedQueryOptions<TResponse>(path, options));

  const result = {
    response: data,
    error,
    isFetching,
    status,
    refetch: () => {
      void refetch();
    },
  };

  return result;
};
