import { tick } from 'svelte';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import { CHECK, NAME } from '@config/linteljs';

import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import Page from './+page.svelte';

const last = languages.at(-1)?.id ?? 'en';

describe('page', () => {
  afterEach(() => {
    applyLanguage('en');
  });

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

  it('speaks the language chosen', async () => {
    render(Page);
    applyLanguage(last);
    await tick();

    const { common } = resources[last];
    const element = screen.getByText(common.homeLedeSvelte);
    expect(element).toBeTruthy();
  });
});
