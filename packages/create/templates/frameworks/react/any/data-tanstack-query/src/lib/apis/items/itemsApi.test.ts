import {
  createElement,
  type FC,
  type ReactNode,
} from 'react';

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

import { useItems } from './itemsApi';

interface WrapperProps {
  readonly children: ReactNode;
}

const ITEMS = [{ id: 1, name: '@linteljs/create' }];

const fetchMock = vi.fn();

const answering = (body: object, status = 200): void => {
  fetchMock
    .mockImplementation(() => {
      const json = JSON.stringify(body);
      const response = new Response(json, { status });

      return Promise.resolve(response);
    });
};

const renderItems = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const Wrapper: FC<WrapperProps> = ({ children }) => {
    return createElement(QueryClientProvider, { client }, children);
  };

  return renderHook(useItems, { wrapper: Wrapper });
};

describe('useItems', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is pending until the list arrives, then holds it', async () => {
    answering(ITEMS);

    const { result } = renderItems();

    expect(result.current.status).toBe('pending');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    const expected = { status: 'success', items: ITEMS };
    expect(result.current).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledWith('/api/items.json', expect.anything());
  });

  it('reports a failed request as an error', async () => {
    answering({}, 500);

    const { result } = renderItems();

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });
});
