import { mount } from '@vue/test-utils';

import ContactIsland from './ContactIsland.vue';

describe('ContactIsland', () => {
  it('mounts the contact view with the provider it reads', () => {
    const island = mount(ContactIsland);

    const send = island
      .get('button')
      .text();

    expect(send).toBe('Send');
  });
});
