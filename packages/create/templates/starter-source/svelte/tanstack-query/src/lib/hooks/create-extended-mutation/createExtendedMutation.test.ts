import WithExtendedMutation from '@mocks/WithExtendedMutation.svelte';
import { QueryClient } from '@tanstack/svelte-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/svelte';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

interface Accepted {
  readonly status: string;
}

const fetchMock = vi.fn();

const answering = (body: Accepted, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    });
};

describe('createExtendedMutation', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the body through the adapter', async () => {
    answering({ status: 'accepted' });
    render(WithExtendedMutation, { path: '/contact' });
    await fireEvent.click(screen.getByRole('button', { name: 'send' }));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('success');
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"message":"hello there"}',
    }));
  });

  it('reports the failure a server sent', async () => {
    answering({ status: 'no' }, 422);
    render(WithExtendedMutation, { path: '/contact' });
    await fireEvent.click(screen.getByRole('button', { name: 'send' }));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
  });

  it('drops the caches it was told to once the write succeeds', async () => {
    answering({ status: 'accepted' });

    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    render(WithExtendedMutation, {
      path: '/contact',
      client,
      invalidates: ['/version'],
    });
    await fireEvent.click(screen.getByRole('button', { name: 'send' }));

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['/version'] });
    });
  });
});
