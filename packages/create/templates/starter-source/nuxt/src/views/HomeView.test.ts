import { mount } from '@vue/test-utils';

import { NAME } from '../config/linteljs';

import HomeView from './HomeView.vue';

describe('HomeView', () => {
  it('carries the project name as its heading', () => {
    expect(mount(HomeView).find('.title').text()).toBe(NAME);
  });

  it('draws the mark', () => {
    expect(mount(HomeView).find('svg[role="img"]').exists()).toBe(true);
  });
});
