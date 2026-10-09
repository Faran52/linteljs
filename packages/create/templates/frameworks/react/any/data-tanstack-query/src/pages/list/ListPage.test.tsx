import { render, screen } from '@testing-library/react';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { initI18n } from '@i18n/i18n';

import { ListPage } from './ListPage';

const ITEMS = [{ id: 1, name: '@linteljs/create' }];

const fetchMock = vi.fn((): Promise<Response> => {
  const json = JSON.stringify(ITEMS);
  const response = new Response(json, {
    headers: { 'Content-Type': 'application/json' },
  });

  return Promise.resolve(response);
});

initI18n();

describe('ListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('titles the page and lists what the endpoint answers', async () => {
    render(
      <StoreProvider>
        <DataProvider>
          <ListPage />
        </DataProvider>
      </StoreProvider>,
    );

    const heading = screen.getByRole('heading', { name: 'List' });
    expect(heading).toBeTruthy();

    const item = await screen.findByText('@linteljs/create');
    expect(item).toBeTruthy();
  });
});
