import { createMutation, useQueryClient } from '@tanstack/svelte-query';

import { type ApiError, request } from '@utils/fetchExtendedUtils';

export interface ExtendedMutationOptions {
  readonly method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Query keys to drop once this succeeds, which is how a list reflects what was just written to it.
  readonly invalidates?: readonly string[];
}

// Unwrapping the reactive object here would end the reactivity it carries.
export const createExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
) => {
  const { method = 'POST', invalidates = [] } = options;
  const client = useQueryClient();

  return createMutation<TResponse, ApiError, TBody>(() => {
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
