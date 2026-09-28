import { render, screen } from '@solidjs/testing-library';

import { DataProvider } from './DataProvider';

describe('DataProvider', () => {
  it('renders what sits under it', () => {
    render(() => {
      return (
        <DataProvider>
          <p>under the data layer</p>
        </DataProvider>
      );
    });

    expect(screen.getByText('under the data layer')).toBeTruthy();
  });
});
