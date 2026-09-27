import { mount } from '@vue/test-utils';

import { NAME } from '../config/linteljs';

import HomeView from './HomeView.vue';

describe('HomeView', () => {
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
});
