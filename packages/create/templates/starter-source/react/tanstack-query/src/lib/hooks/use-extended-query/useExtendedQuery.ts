import { useQuery } from '@tanstack/react-query';
import {
  type ApiError,
  type QueryValue,
  request,
} from '@utils/fetchExtended';

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

/**
 * One hook over the query library and the fetch adapter, so a component asks for a path and gets back a shape it
 * can render rather than a cache entry it has to interpret.
 *
 * Three things are decided here once instead of at every call site. The query key is the path and its query, so
 * two components asking for the same thing share one request. The signal the library hands out is passed down, so
 * a query that unmounts actually cancels. And `refetch` is wrapped to return nothing, because its promise is one
 * nobody awaits and an unawaited promise is a lint finding at every call site.
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
    /*
     * `ApiError` named as the error type rather than left to infer. The library defaults it to `Error`, and the
     * one thing a caller wants off a failure here is the status the adapter put on it.
     */
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
