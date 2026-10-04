import { inject } from '@angular/core';

import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';

import { type ExtendedMutationOptions, extendedMutationOptions } from '@utils/query-options-utils';

import type { ApiError } from '@utils/fetchExtendedUtils';

// Signals come back rather than values, which is what a template reads.
export const injectExtendedMutation = <TResponse, TBody extends object>(
  path: string,
  options: ExtendedMutationOptions = {},
) => {
  // `inject(QueryClient)`: the binding deprecated `injectQueryClient()`.
  const client = inject(QueryClient);

  return injectMutation<TResponse, ApiError, TBody>(() => {
    return extendedMutationOptions<TResponse>(path, client, options);
  });
};
