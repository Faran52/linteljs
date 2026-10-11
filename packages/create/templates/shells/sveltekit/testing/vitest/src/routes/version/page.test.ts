import { tick } from 'svelte';

import { render, screen } from '@testing-library/svelte';

import { ANSWERS, STACK } from '@config/linteljs';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import Page from './+page.svelte';

const last = languages.at(-1)?.id ?? 'en';

describe('version page', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('renders every row it was born with', () => {
    render(Page);

    const element = screen.getByRole('heading', { name: 'Version' });
    expect(element).toBeTruthy();
    expect(screen.getAllByRole('term').length).toBeGreaterThanOrEqual(STACK.length);
  });

  it('renders every answer this project was generated from, labelled in the language chosen', async () => {
    render(Page);
    applyLanguage(last);
    await tick();

    const { common } = resources[last];

    for (const { label } of ANSWERS) {
      const elements = screen.getAllByText(common[label]);
      expect(elements).not.toHaveLength(0);
    }
  });
});
