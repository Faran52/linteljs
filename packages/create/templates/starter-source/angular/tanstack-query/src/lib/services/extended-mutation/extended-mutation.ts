import { inject } from '@angular/core';

import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { type ApiError, request } from '@utils/fetchExtended';

export interface ExtendedMutationOptions {
  readonly method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Query keys to drop once this succeeds, which is how a list reflects what was just written to it.
  readonly invalidates?: readonly string[];
}

// The writing half, in Angular's vocabulary. Signals come back rather than values, which is what a template reads
// and what keeps the view following the request; the same injection-context rule applies as for the query.
export const injectExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
) => {
  const { method = 'POST', invalidates = [] } = options;
  // `inject(QueryClient)`, not `injectQueryClient()`: the binding deprecated the latter.
  const client = inject(QueryClient);

  return injectMutation<TResponse, ApiError, TBody>(() => {
    return {
      mutationFn: (body: TBody) => {
        return request<TResponse>(path, {
          method,
          body,
        });
      },
      onSuccess: async () => {
        await Promise.all(invalidates.map((key) => {
          return client.invalidateQueries({ queryKey: [key] });
        }));
      },
    };
  });
};
