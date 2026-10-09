import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Slices use `injectEndpoints`: two `createApi` calls are two caches a tag cannot cross.
export const baseApi = createApi({
  reducerPath: 'api',
  // The `/api` prefix the mocks answer on, the same one `fetchExtendedUtils.ts` prefixes.
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  // Named up front: a tag injected later cannot be invalidated by a slice that was registered before it.
  tagTypes: ['Contact', 'Version'],
  endpoints: () => {
    return {};
  },
});
