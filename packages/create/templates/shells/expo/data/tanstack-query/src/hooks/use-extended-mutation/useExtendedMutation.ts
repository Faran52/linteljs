import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type ExtendedMutationOptions, extendedMutationOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';

export interface ExtendedMutationResult<TResponse, TBody> {
  readonly send: (body: TBody) => Promise<TResponse>;
  readonly error: ApiError | null;
  readonly isPending: boolean;
  readonly status: 'error' | 'idle' | 'pending' | 'success';
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
    // `ApiError` named for the same reason the query hook names it: the status is what a form acts on.
  } = useMutation<TResponse, ApiError, TBody>(extendedMutationOptions<TResponse>(path, client, options));

  const result = {
    send: mutateAsync,
    error,
    isPending,
    status,
  };

  return result;
};
