import { mount } from '@vue/test-utils';

import Page from './about.vue';

// A route file names a view and nothing else, so its suite checks that the view is what renders.
describe('about route', () => {
  it('renders the AboutView', () => {
    expect(mount(Page).findComponent({ name: 'AboutView' }).exists()).toBe(true);
  });
});
