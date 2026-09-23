import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { StoreProvider } from '../../lib/providers/StoreProvider';

import { HomePage } from './HomePage';

describe('HomePage', () => {
  const open = (): void => {
    render(() => {
      return (
        <StoreProvider>
          <HomePage name="my-app" />
        </StoreProvider>
      );
    });
  };

  it('carries the project name as its heading', () => {
    open();

    expect(screen.getByRole('heading', { name: 'my-app' })).toBeTruthy();
  });

  // Pressed here rather than only in the store's own suite: the button this page hands the store is a child of
  // this file, and nothing else renders it.
  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    expect(screen.getByText('1')).toBeTruthy();
  });
});
