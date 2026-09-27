import { mount } from '@vue/test-utils';

import Page from './version.vue';

describe('version route', () => {
  it('renders the VersionView', () => {
    const rendered = mount(Page)
      .findComponent({ name: 'VersionView' })
      .exists();

    expect(rendered).toBe(true);
  });
});
