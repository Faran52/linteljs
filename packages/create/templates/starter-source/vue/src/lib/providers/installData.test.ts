import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { installData } from './installData';

// A render function rather than a template string: the test build carries the runtime, not the compiler.
const Probe = defineComponent({
  render: () => {
    return h('p', 'under the data layer');
  },
});

describe('installData', () => {
  // The slot, whichever data layer answered: TanStack Query installs its plugin here and none has nothing to
  // install.
  it('installs on the app, leaving what it renders alone', () => {
    const app = mount(Probe, { global: { plugins: [installData] } });

    expect(app.text()).toBe('under the data layer');
  });
});
