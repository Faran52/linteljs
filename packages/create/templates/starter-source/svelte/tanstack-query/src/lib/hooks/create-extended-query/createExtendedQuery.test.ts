import WithExtendedQuery from '@mocks/WithExtendedQuery.svelte';
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

interface Version {
  readonly status: string;
}

// Held rather than read back off `globalThis`, which would need a cast the standard bans outright.
const fetchMock = vi.fn();

const answering = (body: Version, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    });
};

/*
 * Mounted through a host component, because the binding reads its query client out of context and context needs a
 * component to be in. What the host renders is the two things worth asserting: the status and the body.
 */
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

  // The adapter is underneath, so the query reaches it the way every other target's does.
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
