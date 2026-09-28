import { createQuery } from '@tanstack/svelte-query';
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

// Nothing is unwrapped: reading `.data` here would snapshot outside any reactive scope.
export const createExtendedQuery = <TResponse>(
  path: string,
  options: ExtendedQueryOptions = {},
) => {
  const {
    query,
    enabled = true,
    staleTime = 30_000,
  } = options;

  const result = createQuery<TResponse, ApiError>(() => {
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

  return result;
};
