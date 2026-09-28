import { injectQuery } from '@tanstack/angular-query-experimental';
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

// Call it from a field initialiser or another injectable: anywhere else Angular throws.
export const injectExtendedQuery = <TResponse>(
  path: string,
  options: ExtendedQueryOptions = {},
) => {
  const {
    query,
    enabled = true,
    staleTime = 30_000,
  } = options;

  return injectQuery<TResponse, ApiError>(() => {
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
};
