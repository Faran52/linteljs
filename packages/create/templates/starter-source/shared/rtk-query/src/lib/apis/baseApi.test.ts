import { configureStore } from '@reduxjs/toolkit';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { baseApi } from './baseApi';

interface Version {
  readonly status: string;
}

/*
 * Held rather than read back off `globalThis`, which would need a cast the standard bans outright. `fetchBaseQuery`
 * builds a `Request` and hands `fetch` that rather than a url and an options object, so what the call is asserted
 * on is read off the request here, where it is typed, rather than off `mock.calls` afterwards, where it is not.
 */
const requested: string[] = [];

const fetchMock = vi.fn((request: Request): Promise<Response> => {
  requested.push(new URL(request.url).pathname);

  return Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  }));
});

/*
 * An endpoint injected the way a domain slice injects one, which is the whole of what this file is for: what is
 * asserted is that the base query prefixes the origin and that the cache is one slice rather than two.
 *
 * `undefined` for the argument rather than `void`: the standard refuses `void` outside a return position, and an
 * endpoint that takes nothing is one whose argument is `undefined`.
 */
const probeApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      probeVersion: build.query<Version, undefined>({
        query: () => {
          return '/version';
        },
      }),
    };
  },
});

const freshStore = () => {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(baseApi.middleware);
    },
  });
};

describe('baseApi', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    requested.length = 0;
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefixes the origin the mocking layer answers on', async () => {
    const store = freshStore();

    await store.dispatch(probeApi.endpoints.probeVersion.initiate(undefined)).unwrap();

    expect(requested).toEqual(['/api/version']);
  });

  // One slice, one cache. Two `createApi` calls would be two of each, and a tag in one invisible to the other.
  it('keeps every injected endpoint under the one reducer path', () => {
    expect(baseApi.reducerPath).toBe('api');
    expect(Object.keys(freshStore().getState())).toEqual(['api']);
  });
});
