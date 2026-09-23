import {
  defineComponent,
  h,
  nextTick,
  ref,
} from 'vue';
import { mount } from '@vue/test-utils';

import { installData } from '../../providers/installData';

import { useSubmitContact } from './api';

import type { ContactValues } from './schemas';

/*
 * Through the hook and the data slot, so the one suite covers both spellings of this module: a plain async
 * function and a TanStack Query mutation answer the same `useSubmitContact`.
 */
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
  const probe = mount(probeFor(values), { global: { plugins: [installData] } });

  await probe.get('button').trigger('click');
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  await nextTick();

  return probe.get('button').text();
};

describe('useSubmitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    expect(await press({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    })).toBe('sent 200');
  });

  // The rules again, on the far side of the form: a caller that goes round the binding is still refused.
  it('refuses details the rules refuse', async () => {
    expect(await press({
      email: 'not-an-address',
      message: 'short',
    })).toBe('refused');
  });
});
