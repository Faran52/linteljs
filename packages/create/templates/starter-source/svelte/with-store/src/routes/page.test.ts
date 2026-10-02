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

    const element = screen.getByRole('heading', { name: NAME });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    render(Page);

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });

  it('counts up from the store behind it', async () => {
    render(Page);

    const element = screen.getByText('0');
    expect(element).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element2 = screen.getByText('1');
    expect(element2).toBeTruthy();
  });
});
