import { mount } from '@vue/test-utils';

import Page from './version.vue';

// A route file names a view and nothing else, so its suite checks that the view is what renders.
describe('version route', () => {
  it('renders the VersionView', () => {
    const rendered = mount(Page)
      .findComponent({ name: 'VersionView' })
      .exists();

    expect(rendered).toBe(true);
  });
});
