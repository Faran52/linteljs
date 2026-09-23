import { mount } from '@vue/test-utils';

import { GATE, STANDARD_PATHS } from '../config/standard';

import AboutView from './AboutView.vue';

describe('AboutView', () => {
  it('lists every leg of the gate', () => {
    const text = mount(AboutView).text();

    for (const { command } of GATE) {
      expect(text).toContain(command);
    }
  });

  it('names where the standard lives, so nothing has to be hunted for', () => {
    const text = mount(AboutView).text();

    for (const { path } of STANDARD_PATHS) {
      expect(text).toContain(path);
    }
  });
});
