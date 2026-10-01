import { useQuery } from '@tanstack/react-query';

import {
  type ApiError,
  type QueryValue,
  request,
} from '@utils/fetchExtendedUtils';

export interface ExtendedQueryOptions {
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly enabled?: boolean;
  readonly staleTime?: number;
}

export interface ExtendedQueryResult<TResponse> {
  readonly response: TResponse | undefined;
  readonly error: ApiError | null;
  readonly isFetching: boolean;
  readonly status: 'error' | 'pending' | 'success';
  readonly refetch: () => void;
}

// The key is the path and query, so two components share one request; the signal lets an unmount cancel.
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
    // The library defaults the error to `Error`, and a caller wants the status the adapter put on it.
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
