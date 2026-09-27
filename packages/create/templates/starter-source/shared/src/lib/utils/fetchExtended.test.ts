import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ApiError, request } from '@utils/fetchExtended';

interface Named {
  readonly name: string;
}

interface ResponseBody {
  readonly name?: string;
  readonly results?: readonly string[];
  readonly message?: string;
  readonly status?: string;
}

const jsonResponse = (body: ResponseBody, status = 200): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

const fetchMock = vi.fn();

describe('request', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers the parsed body of a request that succeeded', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(jsonResponse({ name: 'demo' }));
    });

    await expect(request<Named>('/version')).resolves.toEqual({ name: 'demo' });
    expect(fetchMock).toHaveBeenCalledWith('/api/version', expect.objectContaining({ method: 'GET' }));
  });

  it('repeats a key for an array rather than flattening it to one value', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(jsonResponse({ results: [] }));
    });
    await request('/search', { query: { tag: ['a', 'b'], page: 2 } });

    expect(fetchMock).toHaveBeenCalledWith('/api/search?tag=a&tag=b&page=2', expect.anything());
  });

  it('encodes a query, and writes no question mark without one', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(jsonResponse({ results: [] }));
    });
    await request('/search', { query: { q: 'a b&c', page: 2 } });
    await request('/search');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/search?q=a%20b%26c&page=2', expect.anything());
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/search', expect.anything());
  });

  it('sends a body as json, and sets the header only when there is one', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(jsonResponse({ status: 'ok' }));
    });
    await request('/contact', { method: 'POST', body: { email: 'a@b.co' } });

    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
      method: 'POST',
      body: '{"email":"a@b.co"}',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('throws ApiError carrying the status a failed request came back with', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(jsonResponse({ message: 'nope' }, 422));
    });

    await expect(request('/contact', { method: 'POST' })).rejects.toThrow(ApiError);
    await expect(request('/contact', { method: 'POST' })).rejects.toMatchObject({ status: 422 });
  });

  it('throws with status 0 when the request never reached a server', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/version')).rejects.toMatchObject({ status: 0 });
  });

  it('roots a path given without a leading slash, and drops an empty query', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(jsonResponse({ status: 'ok' }));
    });
    await request('version');
    await request('/version', { query: {} });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/version', expect.anything());
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/version', expect.anything());
  });

  it('passes an abort signal through when one was given', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(jsonResponse({ status: 'ok' }));
    });

    const controller = new AbortController();

    await request('/version', { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith('/api/version', expect.objectContaining({ signal: controller.signal }));
  });

  it('answers undefined for an empty body rather than failing to parse one', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(new Response(null, { status: 204 }));
    });

    await expect(request('/contact', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
