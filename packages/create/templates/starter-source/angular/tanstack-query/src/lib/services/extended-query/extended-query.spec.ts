import { TestBed } from '@angular/core/testing';

import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { injectExtendedQuery } from './extended-query';

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

const runQuery = (path: string, query?: Record<string, string[]>): ReturnType<typeof injectExtendedQuery<Version>> => {
  TestBed.configureTestingModule({
    providers: [provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } }))],
  });

  return TestBed.runInInjectionContext(() => {
    return injectExtendedQuery<Version>(path, query === undefined ? {} : { query });
  });
};

const settles = async (): Promise<void> => {
  await vi.waitFor(() => {
    expect(fetchMock).toHaveBeenCalled();
  });
};

describe('injectExtendedQuery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('answers the parsed response through a signal', async () => {
    answering({ status: 'ok' });

    const query = runQuery('/version');

    await vi.waitFor(() => {
      expect(query.status()).toBe('success');
    });

    expect(query.data()).toEqual({ status: 'ok' });
  });

  it('sends the query through to the adapter', async () => {
    answering({ status: 'ok' });
    runQuery('/version', { tag: ['a', 'b'] });
    await settles();

    expect(fetchMock).toHaveBeenCalledWith('/api/version?tag=a&tag=b', expect.anything());
  });

  it('carries the adapter error through rather than swallowing it', async () => {
    answering({ status: 'no' }, 500);

    const query = runQuery('/version');

    await vi.waitFor(() => {
      expect(query.status()).toBe('error');
    });

    expect(query.error()).toMatchObject({ status: 500 });
  });
});
