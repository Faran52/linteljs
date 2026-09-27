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

// Held rather than read back off `globalThis`, which would need a cast the standard bans outright.
const fetchMock = vi.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    });
};

/*
 * `createComponent` rather than markup, so this file is a `.ts`: a primitive is not a component, and a camelCase
 * `.tsx` is refused by the same naming rule that keeps components PascalCase. It still renders inside a real
 * provider, because Solid tracks a read rather than a render and the primitive has to run inside the tree.
 */
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
    // Read here as well, because an accessor nothing calls is an accessor nothing proves reactive.
    expect(result.isFetching()).toBe(false);
  });

  // The key is the path and its query, which is what makes two components asking the same thing one request.
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

  // `refetch` answers nothing on purpose: its promise is one nobody awaits, and that is a finding at every caller.
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
