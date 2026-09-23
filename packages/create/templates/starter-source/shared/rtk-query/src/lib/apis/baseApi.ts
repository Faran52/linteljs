import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * RTK Query's counterpart to the fetch adapter and the query hooks, and it is one file rather than three because
 * the library writes the other two itself.
 *
 * There is no `useExtendedQuery` here and there should not be: `createApi` generates a hook per endpoint, so a
 * hand-written wrapper over it would be a second way to do the thing the library already does, and the generated
 * name says what it fetches where `useExtendedQuery('/version')` does not. What is worth sharing is what sits
 * underneath every endpoint, which is this: one base query, one cache, one set of tags.
 *
 * Domain slices reach it through `injectEndpoints` rather than calling `createApi` again. Two `createApi` calls
 * are two caches and two reducers, and a tag invalidated in one is invisible to the other, which is the defect
 * this pattern exists to prevent.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  // The same origin the mocking layer answers on, and the same one `fetchExtended.ts` prefixes.
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  // Named up front: a tag injected later cannot be invalidated by a slice that was registered before it.
  tagTypes: ['Contact', 'Version'],
  endpoints: () => {
    return {};
  },
});
