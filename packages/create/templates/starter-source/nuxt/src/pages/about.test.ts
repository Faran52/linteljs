import { mount } from '@vue/test-utils';

import Page from './about.vue';

describe('about route', () => {
  it('renders the AboutView', () => {
    const rendered = mount(Page)
      .findComponent({ name: 'AboutView' })
      .exists();

    expect(rendered).toBe(true);
  });
});
