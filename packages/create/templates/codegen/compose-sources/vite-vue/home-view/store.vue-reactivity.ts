import { mount, type VueWrapper } from '@vue/test-utils';

import HomeView from './HomeView.vue';

export const mountHome = (): VueWrapper => mount(HomeView);

export const storeCases = (): void => {
  it('draws the mark', () => {
    const drawn = mount(HomeView)
      .find('svg[role="img"]')
      .exists();

    expect(drawn).toBe(true);
  });
};
