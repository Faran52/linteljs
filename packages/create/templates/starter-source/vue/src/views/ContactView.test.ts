import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { dataProvider } from '../lib/providers/data/dataProvider';

import ContactView from './ContactView.vue';

const mounted = { global: { plugins: [dataProvider] } };

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

  it('flags only the field that was left', async () => {
    const view: ReturnType<typeof mount> = mount(ContactView, mounted);

    await fill(view, 'input', 'not-an-address');
    await nextTick();

    const untouched = view
      .find('#message-error')
      .exists();

    expect(untouched).toBe(false);
  });

  it('clears an error as soon as the value is valid', async () => {
    const view: ReturnType<typeof mount> = mount(ContactView, mounted);

    await fill(view, 'input', 'not-an-address');
    await view
      .get('input')
      .setValue('someone@example.com');
    await nextTick();

    const stale = view
      .find('#email-error')
      .exists();

    expect(stale).toBe(false);
  });

  it('keeps Send open while a field is still to fill', async () => {
    const view: ReturnType<typeof mount> = mount(ContactView, mounted);

    await fill(view, 'input', 'someone@example.com');
    await nextTick();

    const disabled = view
      .get('button')
      .attributes('disabled');

    expect(disabled).toBeUndefined();
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
