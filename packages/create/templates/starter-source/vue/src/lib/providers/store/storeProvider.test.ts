import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { storeProvider } from './storeProvider';

const Probe = defineComponent({
  render: () => {
    return h('p', 'under the store');
  },
});

describe('storeProvider', () => {
  it('installs on the app, leaving what it renders alone', () => {
    const app = mount(Probe, { global: { plugins: [storeProvider] } });

    const actual = app.text();
    expect(actual).toBe('under the store');
  });
});
