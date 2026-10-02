import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { StoreProvider } from '@lib/providers/store/StoreProvider';

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

    const element = screen.getByRole('heading', { name: 'my-app' });
    expect(element).toBeTruthy();
  });

  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element = screen.getByText('1');
    expect(element).toBeTruthy();
  });
});
