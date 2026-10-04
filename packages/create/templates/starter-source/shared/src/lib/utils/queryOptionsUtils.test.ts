import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { extendedMutationOptions, extendedQueryOptions } from './queryOptionsUtils';

const fetchMock = vi.fn();

const invalidateQueries = vi.fn(() => {
  return Promise.resolve();
});

const client = { invalidateQueries };

beforeEach(() => {
  fetchMock.mockReset();
  invalidateQueries.mockClear();

  fetchMock
    .mockImplementation(() => {
      const response = new Response('{}');

      return Promise.resolve(response);
    });

  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('extendedQueryOptions', () => {
  it('keys on the path alone, runs, and stays fresh for thirty seconds by default', async () => {
    const { signal } = new AbortController();
    const options = extendedQueryOptions('/version');

    await options.queryFn({ signal });

    const expected = {
      queryKey: ['/version', undefined],
      enabled: true,
      staleTime: 30_000,
    };
    expect(options).toMatchObject(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/version', { method: 'GET', signal });
  });

  it('keys on the query and sends it, with the caller\'s enabled and staleTime', async () => {
    const { signal } = new AbortController();
    const query = { page: 2 };
    const options = extendedQueryOptions('/search', {
      query,
      enabled: false,
      staleTime: 0,
    });

    await options.queryFn({ signal });

    const expected = {
      queryKey: ['/search', query],
      enabled: false,
      staleTime: 0,
    };
    expect(options).toMatchObject(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/search?page=2', expect.objectContaining({ signal }));
  });
});

describe('extendedMutationOptions', () => {
  it('posts the body and invalidates nothing by default', async () => {
    const options = extendedMutationOptions('/contact', client);

    await options.mutationFn({ name: 'Ada' });
    await options.onSuccess();

    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }));
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('sends the method asked for and invalidates every key it names', async () => {
    const options = extendedMutationOptions('/todos', client, {
      method: 'PUT',
      invalidates: ['todos', 'stats'],
    });

    await options.mutationFn({ done: true });
    await options.onSuccess();

    const invalidated = invalidateQueries.mock.calls;
    const expected = [[{ queryKey: ['todos'] }], [{ queryKey: ['stats'] }]];
    expect(fetchMock).toHaveBeenCalledWith('/api/todos', expect.objectContaining({ method: 'PUT' }));
    expect(invalidated).toEqual(expected);
  });
});
