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
  createExtendedMutation,
  type ExtendedMutationOptions,
  type ExtendedMutationResult,
} from './createExtendedMutation';

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
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    });
};

const runMutation = (
  path: string,
  options: ExtendedMutationOptions = {},
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } }),
): ExtendedMutationResult<Accepted, Message> => {
  let captured: ExtendedMutationResult<Accepted, Message> | undefined;

  const host = (): JSX.Element => {
    captured = createExtendedMutation<Accepted, Message>(path, options);

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

describe('createExtendedMutation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the body and answers what came back', async () => {
    answering({ status: 'accepted' });

    const mutation = runMutation('/contact');

    expect(mutation.status()).toBe('idle');
    expect(mutation.isPending()).toBe(false);

    await expect(mutation.send({ message: 'hello there' })).resolves.toEqual({ status: 'accepted' });
    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"message":"hello there"}',
    }));
    await waitFor(() => {
      expect(mutation.status()).toBe('success');
    });
  });

  it('rejects with the adapter error, so a form sees the status a server sent', async () => {
    answering({ status: 'no' }, 422);

    const mutation = runMutation('/contact');

    await expect(mutation.send({ message: 'no' })).rejects.toMatchObject({ status: 422 });
    await waitFor(() => {
      expect(mutation.error()).toMatchObject({ status: 422 });
    });
  });

  it('drops the caches it was told to once the write succeeds', async () => {
    answering({ status: 'accepted' });

    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = runMutation('/contact', { invalidates: ['/version'] }, client);

    await mutation.send({ message: 'hello there' });

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['/version'] });
    });
  });
});
