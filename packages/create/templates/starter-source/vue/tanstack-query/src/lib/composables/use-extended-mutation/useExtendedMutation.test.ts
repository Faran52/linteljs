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
  type ExtendedMutationOptions,
  type ExtendedMutationResult,
  useExtendedMutation,
} from './useExtendedMutation';

interface Accepted {
  readonly status: string;
}

interface Message {
  readonly message: string;
}

const fetchMock = vi.fn();

const answering = (body: Accepted, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      const json = JSON.stringify(body);
      const response = new Response(json, { status });

      return Promise.resolve(response);
    });
};

const runMutation = async (
  path: string,
  options: ExtendedMutationOptions = {},
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } }),
): Promise<ExtendedMutationResult<Accepted, Message>> => {
  let captured: ExtendedMutationResult<Accepted, Message> | undefined;

  const host = defineComponent({
    setup: () => {
      captured = useExtendedMutation<Accepted, Message>(path, options);

      return () => {
        return null;
      };
    },
  });

  mount(host, { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } });
  await flushPromises();

  if (captured === undefined) {
    throw new Error('The composable did not run.');
  }

  return captured;
};

describe('useExtendedMutation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the body and answers what came back', async () => {
    answering({ status: 'accepted' });

    const mutation = await runMutation('/contact');

    const actual = await mutation.send({ message: 'hello there' });
    const expected = { status: 'accepted' };
    expect(actual).toEqual(expected);

    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"message":"hello there"}',
    }));
  });

  it('rejects with the adapter error, so a form sees the status a server sent', async () => {
    answering({ status: 'no' }, 422);

    const mutation = await runMutation('/contact');

    const promise = mutation.send({ message: 'no' });
    const expected = { status: 422 };
    await expect(promise).rejects.toMatchObject(expected);
  });

  it('drops the caches it was told to once the write succeeds', async () => {
    answering({ status: 'accepted' });

    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = await runMutation('/contact', { invalidates: ['/version'] }, client);

    await mutation.send({ message: 'hello there' });

    const expected = { queryKey: ['/version'] };
    expect(invalidate).toHaveBeenCalledWith(expected);
  });
});
