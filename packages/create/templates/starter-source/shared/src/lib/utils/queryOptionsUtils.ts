import { type QueryValue, request } from './fetchExtendedUtils';

export interface ExtendedQueryOptions {
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly enabled?: boolean;
  readonly staleTime?: number;
}

export interface ExtendedMutationOptions {
  readonly method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Query keys to drop once this succeeds, which is how a list reflects what was just written to it.
  readonly invalidates?: readonly string[];
}

interface QueryContext {
  readonly signal: AbortSignal;
}

interface InvalidationFilters {
  readonly queryKey: readonly string[];
}

// Every adapter's client fits this, so no `@tanstack/query-core` import, which a project only has transitively.
export interface QueryInvalidator {
  readonly invalidateQueries: (filters: InvalidationFilters) => Promise<void>;
}

// The key is the path and query, so two callers share one request; the signal lets an unmount cancel.
export const extendedQueryOptions = <TResponse>(path: string, options: ExtendedQueryOptions = {}) => {
  const {
    query,
    enabled = true,
    staleTime = 30_000,
  } = options;

  const queryOptions = {
    queryKey: [path, query],
    queryFn: ({ signal }: QueryContext) => {
      return request<TResponse>(path, {
        ...(query === undefined ? {} : { query }),
        signal,
      });
    },
    enabled,
    staleTime,
  };

  return queryOptions;
};

// Whatever `invalidates` names is dropped on success, the step forgotten most.
export const extendedMutationOptions = <TResponse>(
  path: string,
  client: QueryInvalidator,
  options: ExtendedMutationOptions = {},
) => {
  const { method = 'POST', invalidates = [] } = options;

  const mutationOptions = {
    mutationFn: (body: object) => {
      return request<TResponse>(path, {
        method,
        body,
      });
    },
    onSuccess: async () => {
      const invalidations = invalidates
        .map((key) => {
          return client.invalidateQueries({ queryKey: [key] });
        });

      await Promise.all(invalidations);
    },
  };

  return mutationOptions;
};
