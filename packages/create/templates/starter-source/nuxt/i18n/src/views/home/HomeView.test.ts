import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { CHECK, NAME } from '@config/linteljs';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import HomeView from './HomeView.vue';

const last = languages.at(-1)?.id ?? 'en';

describe('HomeView', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('carries the project name as its heading', () => {
    const title = mount(HomeView)
      .find('.title')
      .text();

    expect(title).toBe(NAME);
  });

  it('draws the mark', () => {
    const drawn = mount(HomeView)
      .find('svg[role="img"]')
      .exists();

    expect(drawn).toBe(true);
  });

  it('names the one command that runs the whole gate', () => {
    const command = mount(HomeView)
      .find('.hint code')
      .text();

    expect(command).toBe(CHECK);
  });

  it('speaks the language chosen', async () => {
    const view = mount(HomeView);

    applyLanguage(last);
    await nextTick();

    const lede = view
      .find('.lede')
      .text();
    expect(lede).toBe(resources[last].common.homeLedeNuxt);
  });
});
