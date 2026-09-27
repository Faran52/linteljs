import { render, screen } from '@testing-library/react';

import { DataProvider } from '../../lib/providers/DataProvider';
import { StoreProvider } from '../../lib/providers/StoreProvider';

import { HomePage } from './HomePage';

const renderPage = (): void => {
  render(
    <StoreProvider>
      <DataProvider>
        <HomePage name="my-app" />
      </DataProvider>
    </StoreProvider>,
  );
};

describe('HomePage', () => {
  it('carries the project name as its heading', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'my-app' })).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    renderPage();

    expect(screen.getByText('pnpm check')).toBeTruthy();
  });
});
