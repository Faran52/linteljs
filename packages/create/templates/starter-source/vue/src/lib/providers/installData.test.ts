import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { installData } from './installData';

const Probe = defineComponent({
  render: () => {
    return h('p', 'under the data layer');
  },
});

describe('installData', () => {
  it('installs on the app, leaving what it renders alone', () => {
    const app = mount(Probe, { global: { plugins: [installData] } });

    expect(app.text()).toBe('under the data layer');
  });
});
