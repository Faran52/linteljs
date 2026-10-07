import { mount } from '@vue/test-utils';

import { dataProvider } from '@lib/providers/data/dataProvider';

import Page from './contact.vue';

describe('contact route', () => {
  it('renders the ContactView', () => {
    const rendered = mount(Page, { global: { plugins: [dataProvider] } })
      .findComponent({ name: 'ContactView' })
      .exists();

    expect(rendered).toBe(true);
  });
});
