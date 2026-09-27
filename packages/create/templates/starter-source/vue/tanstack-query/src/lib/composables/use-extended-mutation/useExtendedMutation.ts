import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { type ApiError, request } from '@utils/fetchExtended';

import type { Ref } from 'vue';

export interface ExtendedMutationOptions {
  readonly method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Query keys to drop once this succeeds, which is how a list reflects what was just written to it.
  readonly invalidates?: readonly string[];
}

export interface ExtendedMutationResult<TResponse, TBody> {
  readonly send: (body: TBody) => Promise<TResponse>;
  readonly error: Ref<ApiError | null>;
  readonly isPending: Ref<boolean>;
  readonly status: Ref<'error'
  | 'idle'
  | 'pending'
  | 'success'>;
}

/**
 * The writing half, in Vue's vocabulary. `send` answers the response rather than nothing, so a form can act on
 * what came back, and it rejects with `ApiError` so the failing path is the adapter's own. Whatever `invalidates`
 * names is dropped on success, which is the step that is forgotten most.
 */
export const useExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
): ExtendedMutationResult<TResponse, TBody> => {
  const { method = 'POST', invalidates = [] } = options;
  const client = useQueryClient();

  const {
    mutateAsync,
    error,
    isPending,
    status,
  } = useMutation<TResponse, ApiError, TBody>({
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
  });

  return {
    send: mutateAsync,
    error,
    isPending,
    status,
  };
};
