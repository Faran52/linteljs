import { createElement } from 'react';

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

import { useExtendedMutation } from './useExtendedMutation';

import type { FC, ReactNode } from 'react';

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
  fetchMock.mockImplementation(() => {
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  });
};

// `createElement` rather than markup, so this file is a `.ts`: a hook is not a component.
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

    const { result } = renderHook(() => {
      return useExtendedMutation<Accepted, Message>('/contact');
    }, { wrapper: wrapperFor(freshClient()) });

    await expect(result.current.send({ message: 'hello there' })).resolves.toEqual({ status: 'accepted' });
    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"message":"hello there"}',
    }));
  });

  it('rejects with the adapter error, so a form sees the status a server sent', async () => {
    answering({ status: 'no' }, 422);

    const { result } = renderHook(() => {
      return useExtendedMutation<Accepted, Message>('/contact');
    }, { wrapper: wrapperFor(freshClient()) });

    await expect(result.current.send({ message: 'no' })).rejects.toMatchObject({ status: 422 });
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  // The step that is forgotten most: a list that does not drop its cache shows what was there before the write.
  it('drops the caches it was told to once the write succeeds', async () => {
    answering({ status: 'accepted' });

    const client = freshClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => {
      return useExtendedMutation<Accepted, Message>('/contact', { invalidates: ['/version'] });
    }, { wrapper: wrapperFor(client) });

    await result.current.send({ message: 'hello there' });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['/version'] });
  });
});
