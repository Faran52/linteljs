import {
  defineComponent,
  h,
  unref,
} from 'vue';
import { mount } from '@vue/test-utils';

import { storeProvider } from '@lib/providers/store/storeProvider';

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

    const actual = first?.text();
    expect(actual).toBe('one 0');

    await first?.trigger('click');

    const actual2 = first?.text();
    expect(actual2).toBe('one 1');
    const actual3 = second?.text();
    expect(actual3).toBe('two 1');
  });
});
