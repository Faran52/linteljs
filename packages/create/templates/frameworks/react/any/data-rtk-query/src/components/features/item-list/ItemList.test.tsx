import { render, screen } from '@testing-library/react';

import { initI18n } from '@i18n/i18n';

import { ItemList } from './ItemList';

import type { ItemsState } from '@apis/items/itemsApi';

initI18n();

describe('ItemList', () => {
  it('shows the mark while the list loads', () => {
    const state: ItemsState = { status: 'pending' };

    render(<ItemList state={state} />);

    const element = screen.getByRole('img', { name: 'linteljs' });
    expect(element).toBeTruthy();
  });

  it('announces a list that failed to load', () => {
    const state: ItemsState = { status: 'error' };

    render(<ItemList state={state} />);

    const message = screen.getByRole('alert').textContent;
    expect(message).toBe('The list could not be loaded.');
  });

  it('says so when the list is empty', () => {
    const state: ItemsState = { status: 'success', items: [] };

    render(<ItemList state={state} />);

    const element = screen.getByText('Nothing here yet.');
    expect(element).toBeTruthy();
  });

  it('lists every item by name', () => {
    const items = [{ id: 1, name: 'first' }, { id: 2, name: 'second' }];
    const state: ItemsState = { status: 'success', items };

    render(<ItemList state={state} />);

    const names = screen
      .getAllByRole('listitem')
      .map((element) => {
        return element.textContent;
      });
    const expected = ['first', 'second'];
    expect(names).toEqual(expected);
  });
});
