import { mount } from '@vue/test-utils';

import Page from './index.vue';

// A route file names a view and nothing else, so its suite checks that the view is what renders.
describe('index route', () => {
  it('renders the HomeView', () => {
    expect(mount(Page).findComponent({ name: 'HomeView' }).exists()).toBe(true);
  });
});
