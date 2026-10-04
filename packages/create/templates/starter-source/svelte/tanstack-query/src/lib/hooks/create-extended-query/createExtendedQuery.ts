import { createQuery } from '@tanstack/svelte-query';

import { type ExtendedQueryOptions, extendedQueryOptions } from '@utils/queryOptionsUtils';

import type { ApiError } from '@utils/fetchExtendedUtils';

// Nothing is unwrapped: reading `.data` here would snapshot outside any reactive scope.
export const createExtendedQuery = <TResponse>(
  path: string,
  options: ExtendedQueryOptions = {},
) => {
  return createQuery<TResponse, ApiError>(() => {
    return extendedQueryOptions<TResponse>(path, options);
  });
};
