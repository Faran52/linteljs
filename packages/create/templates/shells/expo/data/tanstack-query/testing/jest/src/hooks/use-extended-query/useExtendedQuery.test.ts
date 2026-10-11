import {
  createElement,
  type FC,
  type ReactNode,
} from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useExtendedQuery } from './useExtendedQuery';

interface Version {
  readonly status: string;
}

interface WrapperProps {
  readonly children: ReactNode;
}

const fetchMock = jest.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      const json = JSON.stringify(body);
      const response = new Response(json, { status });

      return Promise.resolve(response);
    });
};

const wrapperFor = (client: QueryClient): FC<WrapperProps> => {
  return ({ children }) => {
    return createElement(QueryClientProvider, { client }, children);
  };
};

const freshClient = (): QueryClient => {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
};

describe('useExtendedQuery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('answers the parsed response once the request settles', async () => {
    answering({ status: 'ok' });

    const client = freshClient();

    const { result } = await renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(client) });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    const expected = { status: 'ok' };
    expect(result.current.response).toEqual(expected);
    expect(result.current.isFetching).toBe(false);
  });

  it('sends the query through to the adapter', async () => {
    answering({ status: 'ok' });

    const client = freshClient();

    const { result } = await renderHook(() => {
      return useExtendedQuery<Version>('/version', { query: { tag: ['a', 'b'] } });
    }, { wrapper: wrapperFor(client) });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/version?tag=a&tag=b', expect.anything());
  });

  it('asks for nothing while it is disabled', async () => {
    const client = freshClient();

    await renderHook(() => {
      return useExtendedQuery<Version>('/version', { enabled: false });
    }, { wrapper: wrapperFor(client) });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('carries the adapter error through rather than swallowing it', async () => {
    answering({ status: 'no' }, 500);

    const client = freshClient();

    const { result } = await renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(client) });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    const expected = { status: 500 };
    expect(result.current.error).toMatchObject(expected);
  });

  it('refetches without handing back a promise nobody awaits', async () => {
    answering({ status: 'ok' });

    const client = freshClient();

    const { result } = await renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(client) });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    result.current.refetch();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // Settled before the test ends, so no state update lands after it.
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });
  });
});
