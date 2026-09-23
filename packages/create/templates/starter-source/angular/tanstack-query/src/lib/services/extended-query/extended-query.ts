import { injectQuery } from '@tanstack/angular-query-experimental';
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
 * Angular has no hooks and no composables, so this is neither: it is a function that runs in an injection context
 * and hands back the binding's signal-backed result, which is what a template reads. The file is kebab and the
 * export is `inject*`, because both are what Angular's own CLI and its query binding already spell.
 *
 * Call it from a field initialiser in a component or from another injectable. Calling it anywhere else throws,
 * which is Angular's rule rather than this project's, and the reason there is no wrapper trying to hide it.
 */
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
