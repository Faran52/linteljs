import {
  defineComponent,
  h,
  nextTick,
  ref,
} from 'vue';
import { mount } from '@vue/test-utils';

import { dataProvider } from '@lib/providers/data/dataProvider';

import { useSubmitContact } from './contactApi';

import type { ContactValues } from './schemas';

const probeFor = (values: ContactValues): ReturnType<typeof defineComponent> => {
  return defineComponent({
    setup: () => {
      const submit = useSubmitContact();
      const outcome = ref('waiting');

      const press = async (): Promise<void> => {
        try {
          const result = await submit(values);

          outcome.value = `sent ${String(result.status)}`;
        }
        catch {
          outcome.value = 'refused';
        }
      };

      return () => {
        return h('button', {
          type: 'button',
          onClick: () => {
            void press();
          },
        }, outcome.value);
      };
    },
  });
};

const press = async (values: ContactValues): Promise<string> => {
  const probe = mount(probeFor(values), { global: { plugins: [dataProvider] } });

  await probe
    .get('button')
    .trigger('click');

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  await nextTick();

  return probe
    .get('button')
    .text();
};

describe('useSubmitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    const actual = await press({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });
    expect(actual).toBe('sent 200');
  });

  it('refuses details the rules refuse', async () => {
    const actual = await press({
      email: 'not-an-address',
      message: 'short',
    });
    expect(actual).toBe('refused');
  });
});
