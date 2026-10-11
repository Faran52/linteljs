import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { dataProvider } from './dataProvider';

const Probe = defineComponent({
  render: () => {
    return h('p', 'under the data layer');
  },
});

describe('dataProvider', () => {
  it('installs on the app, leaving what it renders alone', () => {
    const app = mount(Probe, { global: { plugins: [dataProvider] } });

    const actual = app.text();
    expect(actual).toBe('under the data layer');
  });
});
