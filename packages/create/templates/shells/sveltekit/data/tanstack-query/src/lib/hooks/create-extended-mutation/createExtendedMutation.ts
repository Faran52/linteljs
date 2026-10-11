import { createMutation, useQueryClient } from '@tanstack/svelte-query';

import { type ExtendedMutationOptions, extendedMutationOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';

// Unwrapping the reactive object here would end the reactivity it carries.
export const createExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
) => {
  const client = useQueryClient();

  return createMutation<TResponse, ApiError, TBody>(() => {
    return extendedMutationOptions<TResponse>(path, client, options);
  });
};
