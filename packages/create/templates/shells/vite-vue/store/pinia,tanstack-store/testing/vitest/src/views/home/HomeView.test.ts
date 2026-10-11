import { mount } from '@vue/test-utils';

import { NAME } from '@config/linteljs';

import { storeProvider } from '@lib/providers/store/storeProvider';

import HomeView from './HomeView.vue';

describe('HomeView', () => {
  it('carries the project name as its heading', () => {
    const title = mount(HomeView, { global: { plugins: [storeProvider] } })
      .find('.title')
      .text();

    expect(title).toBe(NAME);
  });

  it('adds one to the stored count on each press', async () => {
    const home = mount(HomeView, { global: { plugins: [storeProvider] } });
    const count = home.find('.count');
    const before = Number(count.text());

    await home
      .find('button')
      .trigger('click');

    const after = Number(count.text());
    expect(after).toBe(before + 1);
  });
});
