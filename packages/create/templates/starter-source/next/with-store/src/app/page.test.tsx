import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { NAME } from '../config/linteljs';
import { StoreProvider } from '../lib/providers/StoreProvider';

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

    expect(screen.getByRole('heading', { name: NAME })).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    open();

    expect(screen.getByText('pnpm check')).toBeTruthy();
  });

  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    expect(screen.getByText('1')).toBeTruthy();
  });
});
