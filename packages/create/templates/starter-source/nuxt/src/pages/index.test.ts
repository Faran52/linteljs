import { mount } from '@vue/test-utils';

import Page from './index.vue';

describe('index route', () => {
  it('renders the HomeView', () => {
    const rendered = mount(Page)
      .findComponent({ name: 'HomeView' })
      .exists();

    expect(rendered).toBe(true);
  });
});
