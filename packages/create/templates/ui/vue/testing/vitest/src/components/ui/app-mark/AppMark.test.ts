import { mount } from '@vue/test-utils';

import AppMark from './AppMark.vue';

describe('AppMark', () => {
  it('draws the beam and the lines that come into line with it', () => {
    const mark = mount(AppMark);

    const drawn = mark
      .find('svg[role="img"]')
      .exists();

    expect(drawn).toBe(true);
    const found = mark.findAll('path');
    expect(found).toHaveLength(4);
  });
});
