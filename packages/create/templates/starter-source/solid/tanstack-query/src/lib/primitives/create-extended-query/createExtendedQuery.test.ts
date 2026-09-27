import { createComponent, type JSX } from 'solid-js';
import { render, waitFor } from '@solidjs/testing-library';

import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  createExtendedQuery,
  type ExtendedQueryOptions,
  type ExtendedQueryResult,
} from './createExtendedQuery';

interface Version {
  readonly status: string;
}

const fetchMock = vi.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    });
};

const runQuery = (path: string, options: ExtendedQueryOptions = {}): ExtendedQueryResult<Version> => {
  let captured: ExtendedQueryResult<Version> | undefined;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const host = (): JSX.Element => {
    captured = createExtendedQuery<Version>(path, options);

    return null;
  };

  render(() => {
    return createComponent(QueryClientProvider, {
      client,
      get children() {
        return createComponent(host, {});
      },
    });
  });

  if (captured === undefined) {
    throw new Error('The primitive did not run.');
  }

  return captured;
};

describe('createExtendedQuery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the parsed response through an accessor', async () => {
    answering({ status: 'ok' });

    const result = runQuery('/version');

    await waitFor(() => {
      expect(result.status()).toBe('success');
    });
    expect(result.response()).toEqual({ status: 'ok' });
    expect(result.isFetching()).toBe(false);
  });

  it('sends the query through to the adapter', async () => {
    answering({ status: 'ok' });
    runQuery('/version', { query: { tag: ['a', 'b'] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/version?tag=a&tag=b', expect.anything());
    });
  });

  it('asks for nothing while it is disabled', () => {
    runQuery('/version', { enabled: false });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('carries the adapter error through rather than swallowing it', async () => {
    answering({ status: 'no' }, 500);

    const result = runQuery('/version');

    await waitFor(() => {
      expect(result.status()).toBe('error');
    });
    expect(result.error()).toMatchObject({ status: 500 });
  });

  it('refetches without handing back a promise nobody awaits', async () => {
    answering({ status: 'ok' });

    const result = runQuery('/version');

    await waitFor(() => {
      expect(result.status()).toBe('success');
    });
    result.refetch();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
