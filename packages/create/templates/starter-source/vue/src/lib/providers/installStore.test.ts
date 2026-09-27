import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { installStore } from './installStore';

const Probe = defineComponent({
  render: () => {
    return h('p', 'under the store');
  },
});

describe('installStore', () => {
  it('installs on the app, leaving what it renders alone', () => {
    const app = mount(Probe, { global: { plugins: [installStore] } });

    expect(app.text()).toBe('under the store');
  });
});
