import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { CHECK, NAME } from '@config/linteljs';

import { StoreProvider } from '@lib/providers/store/StoreProvider';

import HomePage from './page';

const open = (): void => {
  render(
    <StoreProvider>
      <HomePage />
    </StoreProvider>,
  );
};

describe('the home route', () => {
  it('carries the project name as its heading', () => {
    open();

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    open();

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });

  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element = screen.getByText('1');
    expect(element).toBeTruthy();
  });
});
