import {
  defineComponent,
  h,
  unref,
} from 'vue';
import { mount } from '@vue/test-utils';

import { installStore } from '../providers/installStore';

import { useCounter } from './counter';

/*
 * Two readers of the one store, in one component because `vue/one-component-per-file` allows no second, and in
 * one app because Pinia installs a fresh store per app and two mounts would not be reading the same one.
 *
 * Through `installStore`, so this covers every store: Pinia needs its plugin on the app and the others ignore it.
 * `unref` because Pinia unwraps its own state and TanStack Store hands back a ref.
 */
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
  // What a store is for is that the second reader sees what the first did.
  it('counts up, and every reader sees the same count', async () => {
    const app = mount(Probe, { global: { plugins: [installStore] } });
    const [first, second] = app.findAll('button');

    expect(first?.text()).toBe('one 0');

    await first?.trigger('click');

    expect(first?.text()).toBe('one 1');
    expect(second?.text()).toBe('two 1');
  });
});
