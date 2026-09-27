import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { installData } from '../lib/providers/installData';

import ContactView from './ContactView.vue';

const mounted = { global: { plugins: [installData] } };

const fill = async (view: ReturnType<typeof mount>, selector: string, value: string): Promise<void> => {
  const field = view.get(selector);

  await field.setValue(value);
  await field.trigger('blur');
};

describe('ContactView', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    const view: ReturnType<typeof mount> = mount(ContactView, mounted);

    await fill(view, 'input', 'not-an-address');
    await nextTick();

    const message = view
      .get('#email-error')
      .text();

    expect(message).toBe('Enter a valid email address.');
  });

  it('sends once both fields are valid', async () => {
    const view: ReturnType<typeof mount> = mount(ContactView, mounted);

    await fill(view, 'input', 'someone@example.com');
    await fill(view, 'textarea', 'Ten characters, at least.');
    await view
      .get('form')
      .trigger('submit');
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    await nextTick();

    const confirmed = view
      .find('[role="status"]')
      .exists();

    expect(confirmed).toBe(true);
  });
});
