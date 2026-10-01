import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import { CHECK, NAME } from '@config/linteljs';

import Page from './+page.svelte';

describe('page', () => {
  it('carries the project name as its heading', () => {
    render(Page);

    expect(screen.getByRole('heading', { name: NAME })).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    render(Page);

    expect(screen.getByText(CHECK)).toBeTruthy();
  });

  it('counts up from the store behind it', async () => {
    render(Page);

    expect(screen.getByText('0')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    expect(screen.getByText('1')).toBeTruthy();
  });
});
