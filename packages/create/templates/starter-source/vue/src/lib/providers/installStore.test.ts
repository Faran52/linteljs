import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { installStore } from './installStore';

// A render function rather than a template string: the test build carries the runtime, not the compiler.
const Probe = defineComponent({
  render: () => {
    return h('p', 'under the store');
  },
});

describe('installStore', () => {
  // The slot, whichever store answered: Pinia installs itself on the app here and the others have nothing to
  // install. What every spelling owes the application is that the app still mounts.
  it('installs on the app, leaving what it renders alone', () => {
    const app = mount(Probe, { global: { plugins: [installStore] } });

    expect(app.text()).toBe('under the store');
  });
});
