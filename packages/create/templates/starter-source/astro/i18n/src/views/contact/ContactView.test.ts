import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { dataProvider } from '@lib/providers/data/dataProvider';

import ContactView from './ContactView.vue';

const mounted = {
  global: { plugins: [dataProvider] },
  props: {
    phrase: (key: string): string => {
      return `t:${key}`;
    },
  },
};

const fill = async (view: ReturnType<typeof mount>, selector: string, value: string): Promise<void> => {
  const field = view.get(selector);

  await field.setValue(value);
  await field.trigger('blur');
};

describe('ContactView', () => {
  it('names the page and its send button in the words it is handed', () => {
    const view: ReturnType<typeof mount> = mount(ContactView, mounted);

    const title = view
      .get('h1')
      .text();
    const send = view
      .get('button')
      .text();

    expect(title).toBe('t:contact');
    expect(send).toBe('t:contactSend');
  });

  it('says why a field is refused in the words it is handed', async () => {
    const view: ReturnType<typeof mount> = mount(ContactView, mounted);

    await fill(view, 'input', 'not-an-address');
    await nextTick();

    const message = view
      .get('#email-error')
      .text();

    expect(message).toBe('t:contactEmailInvalid');
  });

  it('confirms in the words it is handed once both fields are valid', async () => {
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
      .get('[role="status"]')
      .text();

    expect(confirmed).toBe('t:contactSent');
  });
});
