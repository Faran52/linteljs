import {
  createElement,
  type FC,
  type ReactNode,
} from 'react';

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

import { useExtendedMutation } from './useExtendedMutation';

interface Accepted {
  readonly status: string;
}

interface Message {
  readonly message: string;
}

interface WrapperProps {
  readonly children: ReactNode;
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

const wrapperFor = (client: QueryClient): FC<WrapperProps> => {
  return ({ children }) => {
    return createElement(QueryClientProvider, { client }, children);
  };
};

const freshClient = (): QueryClient => {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
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

    const client = freshClient();

    const { result } = await renderHook(() => {
      return useExtendedMutation<Accepted, Message>('/contact');
    }, { wrapper: wrapperFor(client) });

    const actual = await result.current.send({ message: 'hello there' });
    const expected = { status: 'accepted' };
    expect(actual).toEqual(expected);

    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"message":"hello there"}',
    }));
  });

  it('rejects with the adapter error, so a form sees the status a server sent', async () => {
    answering({ status: 'no' }, 422);

    const client = freshClient();

    const { result } = await renderHook(() => {
      return useExtendedMutation<Accepted, Message>('/contact');
    }, { wrapper: wrapperFor(client) });

    const promise = result.current.send({ message: 'no' });
    const expected = { status: 422 };
    await expect(promise).rejects.toMatchObject(expected);

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  it('drops the caches it was told to once the write succeeds', async () => {
    answering({ status: 'accepted' });

    const client = freshClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    const { result } = await renderHook(() => {
      return useExtendedMutation<Accepted, Message>('/contact', { invalidates: ['/version'] });
    }, { wrapper: wrapperFor(client) });

    await result.current.send({ message: 'hello there' });

    const expected = { queryKey: ['/version'] };
    expect(invalidate).toHaveBeenCalledWith(expected);
  });
});
