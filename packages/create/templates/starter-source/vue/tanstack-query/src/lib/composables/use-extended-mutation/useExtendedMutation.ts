import { useMutation, useQueryClient } from '@tanstack/vue-query';

import { type ExtendedMutationOptions, extendedMutationOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';
import type { Ref } from 'vue';

export interface ExtendedMutationResult<TResponse, TBody> {
  readonly send: (body: TBody) => Promise<TResponse>;
  readonly error: Ref<ApiError | null>;
  readonly isPending: Ref<boolean>;
  readonly status: Ref<'error'
  | 'idle'
  | 'pending'
  | 'success'>;
}

export const useExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
): ExtendedMutationResult<TResponse, TBody> => {
  const client = useQueryClient();

  const {
    mutateAsync,
    error,
    isPending,
    status,
  } = useMutation<TResponse, ApiError, TBody>(extendedMutationOptions<TResponse>(path, client, options));

  const extendedMutation: ExtendedMutationResult<TResponse, TBody> = {
    send: mutateAsync,
    error,
    isPending,
    status,
  };

  return extendedMutation;
};
