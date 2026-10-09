import {
  createElement,
  type FC,
  type ReactNode,
} from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { baseApi } from '@apis/base/baseApi';

import { useItems } from './itemsApi';

interface WrapperProps {
  readonly children: ReactNode;
}

const ITEMS = [{ id: 1, name: '@linteljs/create' }];

const requested: string[] = [];

let answer = { body: ITEMS, status: 200 };

// Typed as `fetch` is, so jest can spy the global with it; `fetchBaseQuery` hands it a `Request`.
const fetchMock = vi.fn((input: RequestInfo | URL): Promise<Response> => {
  requested.push(new URL(new Request(input).url).pathname);

  const json = JSON.stringify(answer.body);
  const response = new Response(json, {
    status: answer.status,
    headers: { 'Content-Type': 'application/json' },
  });

  return Promise.resolve(response);
});

// A store per test, so no test reads the list another one cached.
const renderItems = () => {
  const store = configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(baseApi.middleware);
    },
  });

  const Wrapper: FC<WrapperProps> = ({ children }) => {
    return createElement(Provider, { store }, children);
  };

  return renderHook(useItems, { wrapper: Wrapper });
};

describe('useItems', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    requested.length = 0;
    answer = { body: ITEMS, status: 200 };
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is pending until the list arrives, then holds it', async () => {
    const { result } = renderItems();

    expect(result.current.status).toBe('pending');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    const expected = { status: 'success', items: ITEMS };
    expect(result.current).toEqual(expected);
    const expectedPaths = ['/api/items.json'];
    expect(requested).toEqual(expectedPaths);
  });

  it('reports a failed request as an error', async () => {
    answer = { body: [], status: 500 };

    const { result } = renderItems();

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });
});
