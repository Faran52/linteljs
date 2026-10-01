import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  type ExtendedQueryOptions,
  type ExtendedQueryResult,
  useExtendedQuery,
} from './useExtendedQuery';

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

const runQuery = async (
  path: string,
  options: ExtendedQueryOptions = {},
): Promise<ExtendedQueryResult<Version>> => {
  let captured: ExtendedQueryResult<Version> | undefined;

  const host = defineComponent({
    setup: () => {
      captured = useExtendedQuery<Version>(path, options);

      return () => {
        return null;
      };
    },
  });

  mount(host, {
    global: {
      plugins: [[VueQueryPlugin, {
        queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
      }]],
    },
  });

  await flushPromises();

  if (captured === undefined) {
    throw new Error('The composable did not run.');
  }

  return captured;
};

describe('useExtendedQuery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the parsed response as a ref the template can unwrap', async () => {
    answering({ status: 'ok' });

    const result = await runQuery('/version');

    expect(result.status.value).toBe('success');
    expect(result.response.value).toEqual({ status: 'ok' });
  });

  it('sends the query through to the adapter', async () => {
    answering({ status: 'ok' });
    await runQuery('/version', { query: { tag: ['a', 'b'] } });

    expect(fetchMock).toHaveBeenCalledWith('/api/version?tag=a&tag=b', expect.anything());
  });

  it('asks for nothing while it is disabled', async () => {
    await runQuery('/version', { enabled: false });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('carries the adapter error through rather than swallowing it', async () => {
    answering({ status: 'no' }, 500);

    const result = await runQuery('/version');

    expect(result.status.value).toBe('error');
    expect(result.error.value).toMatchObject({ status: 500 });
  });

  it('refetches without handing back a promise nobody awaits', async () => {
    answering({ status: 'ok' });

    const result = await runQuery('/version');

    result.refetch();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
