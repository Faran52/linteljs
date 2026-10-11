import { render, screen } from '@testing-library/react';

import { DataProvider } from './DataProvider';

describe('DataProvider', () => {
  it('renders what sits under it', () => {
    render(
      <DataProvider>
        <p>under the data layer</p>
      </DataProvider>,
    );

    const element = screen.getByText('under the data layer');
    expect(element).toBeTruthy();
  });
});
