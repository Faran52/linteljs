import {
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

import WithExtendedQuery from '@mocks/WithExtendedQuery.svelte';

interface Version {
  readonly status: string;
}

const fetchMock = vi.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      const json = JSON.stringify(body);
      const response = new Response(json, { status });

      return Promise.resolve(response);
    });
};

describe('createExtendedQuery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the parsed response once the request settles', async () => {
    answering({ status: 'ok' });
    render(WithExtendedQuery, { path: '/version' });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('success');
    });

    expect(screen.getByTestId('body').textContent).toBe('{"status":"ok"}');
  });

  it('sends the query through to the adapter', async () => {
    answering({ status: 'ok' });

    render(WithExtendedQuery, {
      path: '/version',
      query: { tag: ['a', 'b'] },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/version?tag=a&tag=b', expect.anything());
    });
  });

  it('reports the failure rather than swallowing it', async () => {
    answering({ status: 'no' }, 500);
    render(WithExtendedQuery, { path: '/version' });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
  });
});
