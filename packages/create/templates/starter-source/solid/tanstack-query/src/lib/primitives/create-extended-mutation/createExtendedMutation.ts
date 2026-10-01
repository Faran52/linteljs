import { useMutation, useQueryClient } from '@tanstack/solid-query';

import { type ApiError, request } from '@utils/fetchExtendedUtils';

import type { Accessor } from 'solid-js';

export interface ExtendedMutationOptions {
  readonly method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Query keys to drop once this succeeds, which is how a list reflects what was just written to it.
  readonly invalidates?: readonly string[];
}

export interface ExtendedMutationResult<TResponse, TBody> {
  readonly send: (body: TBody) => Promise<TResponse>;
  readonly error: Accessor<ApiError | null>;
  readonly isPending: Accessor<boolean>;
  readonly status: Accessor<'error'
  | 'idle'
  | 'pending'
  | 'success'>;
}

export const createExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
): ExtendedMutationResult<TResponse, TBody> => {
  const { method = 'POST', invalidates = [] } = options;
  const client = useQueryClient();

  const mutation = useMutation<TResponse, ApiError, TBody>(() => {
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

  return {
    send: (body) => {
      return mutation.mutateAsync(body);
    },
    error: () => {
      return mutation.error;
    },
    isPending: () => {
      return mutation.isPending;
    },
    status: () => {
      return mutation.status;
    },
  };
};
