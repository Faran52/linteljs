import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ApiError, request } from '@utils/fetchExtended';

export interface ExtendedMutationOptions {
  readonly method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Query keys to drop once this succeeds, which is how a list reflects what was just written to it.
  readonly invalidates?: readonly string[];
}

export interface ExtendedMutationResult<TResponse, TBody> {
  readonly send: (body: TBody) => Promise<TResponse>;
  readonly error: ApiError | null;
  readonly isPending: boolean;
  readonly status: 'error' | 'idle' | 'pending' | 'success';
}

/**
 * The writing half, and the same trade as the query hook: a component says what it is sending and where, and
 * everything about caches stays here.
 *
 * `send` answers the response rather than nothing, so a form can act on what came back without reading the
 * mutation object afterwards, and it rejects with `ApiError` so the failing path is the same one the adapter
 * already defines. Whatever `invalidates` names is dropped on success, which is the step that is forgotten most.
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
    // `ApiError` named for the same reason the query hook names it: the status is what a form acts on.
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
