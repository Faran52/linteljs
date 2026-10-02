import { render, screen } from '@testing-library/react';

import { CHECK } from '@config/linteljs';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

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

    const element = screen.getByRole('heading', { name: 'my-app' });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    renderPage();

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });
});
