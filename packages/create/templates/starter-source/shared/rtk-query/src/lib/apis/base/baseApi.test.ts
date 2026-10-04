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

const requested: string[] = [];

// Typed as `fetch` is, so jest can spy the global with it; `fetchBaseQuery` hands it a `Request`.
const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
  requested.push(new URL(new Request(input).url).pathname);

  const json = JSON.stringify({ status: 'ok' });
  const response = new Response(json, {
    headers: { 'Content-Type': 'application/json' },
  });

  return Promise.resolve(response);
});

const probeApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    const endpoints = {
      probeVersion: build.query<Version, undefined>({
        query: () => {
          return '/version';
        },
      }),
    };

    return endpoints;
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

    const versionQuery = probeApi.endpoints.probeVersion.initiate(undefined);

    await store
      .dispatch(versionQuery)
      .unwrap();

    const expected = ['/api/version'];
    expect(requested).toEqual(expected);
  });

  it('keeps every injected endpoint under the one reducer path', () => {
    expect(baseApi.reducerPath).toBe('api');
    const actual = Object.keys(freshStore().getState());
    const expected = ['api'];
    expect(actual).toEqual(expected);
  });
});
