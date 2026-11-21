import { mount, type VueWrapper } from '@vue/test-utils';

import { storeProvider } from '@lib/providers/store/storeProvider';

import HomeView from './HomeView.vue';

export const mountHome = (): VueWrapper => mount(HomeView, { global: { plugins: [storeProvider] } });

export const storeCases = (): void => {
  it('adds one to the stored count on each press', async () => {
    const home = mount(HomeView, { global: { plugins: [storeProvider] } });
    const count = home.find('[aria-live]');
    const before = Number(count.text());

    await home
      .find('button')
      .trigger('click');

    const after = Number(count.text());
    expect(after).toBe(before + 1);
  });
};
