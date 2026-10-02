import {
  createElement,
  type FC,
  type ReactNode,
} from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useExtendedQuery } from './useExtendedQuery';

interface Version {
  readonly status: string;
}

interface WrapperProps {
  readonly children: ReactNode;
}

const fetchMock = vi.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    });
};

const wrapperFor = (client: QueryClient): FC<WrapperProps> => {
  return ({ children }) => {
    return createElement(QueryClientProvider, { client }, children);
  };
};

const freshClient = (): QueryClient => {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
};

describe('useExtendedQuery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the parsed response once the request settles', async () => {
    answering({ status: 'ok' });

    const { result } = await renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(freshClient()) });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    const expected = { status: 'ok' };
    expect(result.current.response).toEqual(expected);
    expect(result.current.isFetching).toBe(false);
  });

  it('sends the query through to the adapter', async () => {
    answering({ status: 'ok' });

    await renderHook(() => {
      return useExtendedQuery<Version>('/version', { query: { tag: ['a', 'b'] } });
    }, { wrapper: wrapperFor(freshClient()) });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/version?tag=a&tag=b', expect.anything());
    });
  });

  it('asks for nothing while it is disabled', async () => {
    await renderHook(() => {
      return useExtendedQuery<Version>('/version', { enabled: false });
    }, { wrapper: wrapperFor(freshClient()) });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('carries the adapter error through rather than swallowing it', async () => {
    answering({ status: 'no' }, 500);

    const { result } = await renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(freshClient()) });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    const expected = { status: 500 };
    expect(result.current.error).toMatchObject(expected);
  });

  it('refetches without handing back a promise nobody awaits', async () => {
    answering({ status: 'ok' });

    const { result } = await renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(freshClient()) });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    result.current.refetch();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
