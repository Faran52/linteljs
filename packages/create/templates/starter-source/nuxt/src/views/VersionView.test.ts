import { mount } from '@vue/test-utils';

import { STACK } from '../config/linteljs';

import VersionView from './VersionView.vue';

describe('VersionView', () => {
  it('renders every recorded row of the stack', () => {
    const text = mount(VersionView).text();

    for (const { name, version } of STACK) {
      expect(text).toContain(name);
      expect(text).toContain(version);
    }
  });
});
