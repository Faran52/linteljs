import {
  createElement,
  type FC,
  type ReactNode,
} from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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

// Held rather than read back off `globalThis`, which would need a cast the standard bans outright.
const fetchMock = vi.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock.mockImplementation(() => {
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  });
};

/*
 * `createElement` rather than markup, so this file is a `.ts`: a hook is not a component, and a camelCase `.tsx`
 * is refused by the same naming rule that keeps components PascalCase. One client per test and no retries, so a
 * failing case fails once rather than four times slowly.
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

    const { result } = renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(freshClient()) });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.response).toEqual({ status: 'ok' });
  });

  // The key is the path and its query, which is what makes two components asking the same thing one request.
  it('sends the query through to the adapter', async () => {
    answering({ status: 'ok' });

    renderHook(() => {
      return useExtendedQuery<Version>('/version', { query: { page: 2 } });
    }, { wrapper: wrapperFor(freshClient()) });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/version?page=2', expect.anything());
    });
  });

  it('asks for nothing while it is disabled', () => {
    renderHook(() => {
      return useExtendedQuery<Version>('/version', { enabled: false });
    }, { wrapper: wrapperFor(freshClient()) });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('carries the adapter error through rather than swallowing it', async () => {
    answering({ status: 'no' }, 500);

    const { result } = renderHook(() => {
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

    const { result } = renderHook(() => {
      return useExtendedQuery<Version>('/version');
    }, { wrapper: wrapperFor(freshClient()) });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    /*
     * Called as a statement, which is the whole point of the wrapper: it answers nothing, so there is no promise
     * to float and no `void` for a caller to remember. That it returns nothing is the signature's job to say.
     */
    result.current.refetch();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
