import {
  defineComponent,
  h,
  unref,
} from 'vue';
import { mount } from '@vue/test-utils';

import { storeProvider } from '../../providers/store/storeProvider';

import { useCounter } from './counterStore';

const Probe = defineComponent({
  setup: () => {
    const one = useCounter();
    const two = useCounter();

    return () => {
      return h('div', [
        h('button', {
          type: 'button',
          onClick: one.add,
        }, `one ${String(unref(one.count))}`),
        h('button', { type: 'button' }, `two ${String(unref(two.count))}`),
      ]);
    };
  },
});

describe('useCounter', () => {
  it('counts up, and every reader sees the same count', async () => {
    const app = mount(Probe, { global: { plugins: [storeProvider] } });
    const [first, second] = app.findAll('button');

    expect(first?.text()).toBe('one 0');

    await first?.trigger('click');

    expect(first?.text()).toBe('one 1');
    expect(second?.text()).toBe('two 1');
  });
});
