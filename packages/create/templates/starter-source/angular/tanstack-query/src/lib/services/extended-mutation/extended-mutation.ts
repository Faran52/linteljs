import { inject } from '@angular/core';

import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';

import { type ApiError, request } from '@utils/fetchExtendedUtils';

export interface ExtendedMutationOptions {
  readonly method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Query keys to drop once this succeeds, which is how a list reflects what was just written to it.
  readonly invalidates?: readonly string[];
}

// Signals come back rather than values, which is what a template reads.
export const injectExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
) => {
  const { method = 'POST', invalidates = [] } = options;
  // `inject(QueryClient)`: the binding deprecated `injectQueryClient()`.
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
        const invalidations = invalidates
          .map((key) => {
            return client.invalidateQueries({ queryKey: [key] });
          });

        await Promise.all(invalidations);
      },
    };
  });
};
