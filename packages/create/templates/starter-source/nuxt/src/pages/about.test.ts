import { mount } from '@vue/test-utils';

import Page from './about.vue';

// A route file names a view and nothing else, so its suite checks that the view is what renders.
describe('about route', () => {
  it('renders the AboutView', () => {
    const rendered = mount(Page)
      .findComponent({ name: 'AboutView' })
      .exists();

    expect(rendered).toBe(true);
  });
});
