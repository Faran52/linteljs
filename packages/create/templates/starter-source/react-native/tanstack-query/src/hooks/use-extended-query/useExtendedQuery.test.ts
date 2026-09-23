import { createElement } from 'react';

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

import type { FC, ReactNode } from 'react';

interface Version {
  readonly status: string;
}

interface WrapperProps {
  readonly children: ReactNode;
}

// Held rather than read back off `globalThis`, which would need a cast the standard bans outright.
const fetchMock = vi.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock.mockImplementation(() => {
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  });
};

/*
 * `@testing-library/react-native`, not the web one: this target renders through a native test renderer and has no
 * DOM, which is the one thing that keeps this suite from being React's own verbatim. `createElement` rather than
 * markup, so the file is a `.ts`: a hook is not a component.
 */
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
    expect(result.current.response).toEqual({ status: 'ok' });
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
    expect(result.current.error).toMatchObject({ status: 500 });
  });

  // `refetch` answers nothing on purpose: its promise is one nobody awaits, and that is a finding at every caller.
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
