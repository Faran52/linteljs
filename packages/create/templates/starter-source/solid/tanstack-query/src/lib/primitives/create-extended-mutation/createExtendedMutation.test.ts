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
  type ExtendedMutationResult,
} from './createExtendedMutation';

import type { ExtendedMutationOptions } from '@utils/queryOptionsUtils';

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

    const actual = mutation.status();
    expect(actual).toBe('idle');
    const actual2 = mutation.isPending();
    expect(actual2).toBe(false);

    const actual3 = await mutation.send({ message: 'hello there' });
    const expected = { status: 'accepted' };
    expect(actual3).toEqual(expected);

    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"message":"hello there"}',
    }));

    await waitFor(() => {
      const actual = mutation.status();
      expect(actual).toBe('success');
    });
  });

  it('rejects with the adapter error, so a form sees the status a server sent', async () => {
    answering({ status: 'no' }, 422);

    const mutation = runMutation('/contact');

    const promise = mutation.send({ message: 'no' });
    const expected = { status: 422 };
    await expect(promise).rejects.toMatchObject(expected);

    await waitFor(() => {
      const actual = mutation.error();
      const expected = { status: 422 };
      expect(actual).toMatchObject(expected);
    });
  });

  it('drops the caches it was told to once the write succeeds', async () => {
    answering({ status: 'accepted' });

    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = runMutation('/contact', { invalidates: ['/version'] }, client);

    await mutation.send({ message: 'hello there' });

    await waitFor(() => {
      const expected = { queryKey: ['/version'] };
      expect(invalidate).toHaveBeenCalledWith(expected);
    });
  });
});
