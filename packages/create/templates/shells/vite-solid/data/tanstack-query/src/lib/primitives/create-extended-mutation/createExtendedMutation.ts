import { useMutation, useQueryClient } from '@tanstack/solid-query';

import { type ExtendedMutationOptions, extendedMutationOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';
import type { Accessor } from 'solid-js';

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
  const client = useQueryClient();

  const mutation = useMutation<TResponse, ApiError, TBody>(() => {
    return extendedMutationOptions<TResponse>(path, client, options);
  });

  const extendedMutation: ExtendedMutationResult<TResponse, TBody> = {
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

  return extendedMutation;
};
