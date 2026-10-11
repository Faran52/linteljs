import { injectQuery } from '@tanstack/angular-query-experimental';

import { type ExtendedQueryOptions, extendedQueryOptions } from '@utils/query-options-utils';

import type { ApiError } from '@utils/fetchExtendedUtils';

// Call it from a field initialiser or another injectable: anywhere else Angular throws.
export const injectExtendedQuery = <TResponse>(
  path: string,
  options: ExtendedQueryOptions = {},
) => {
  return injectQuery<TResponse, ApiError>(() => {
    return extendedQueryOptions<TResponse>(path, options);
  });
};
