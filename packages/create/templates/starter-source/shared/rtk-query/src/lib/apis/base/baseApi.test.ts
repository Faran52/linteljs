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

const fetchMock = vi.fn((request: Request): Promise<Response> => {
  requested.push(new URL(request.url).pathname);

  return Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  }));
});

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

    await store
      .dispatch(probeApi.endpoints.probeVersion.initiate(undefined))
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
