import { mount } from '@vue/test-utils';

import AppMark from './AppMark.vue';

describe('AppMark', () => {
  // The beam is the standard and the three lines are the files, one path each; all four have to be drawn.
  it('draws the beam and the lines that come into line with it', () => {
    const mark = mount(AppMark);

    const drawn = mark
      .find('svg[role="img"]')
      .exists();

    expect(drawn).toBe(true);
    expect(mark.findAll('path')).toHaveLength(4);
  });
});
