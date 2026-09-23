import { createQuery } from '@tanstack/svelte-query';
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

/**
 * `create*` rather than `use*`, which is the verb Svelte's own binding uses and the one this project follows.
 *
 * The options go in as a function and the result comes back as the binding's reactive object, read directly in a
 * template. Nothing is unwrapped here: reading `.data` in this file would take one snapshot outside any reactive
 * scope, and the view would never update again. `refetch` is wrapped to answer nothing, so no caller is left with
 * a promise to float.
 */
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
