import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';

import { dataProvider } from '@lib/providers/data/dataProvider';
import { type ContactKey } from '@services/contact-form/contactFormService';

import { type ContactForm, useContactForm } from './useContactForm';

const translate = (key: ContactKey): string => {
  return `t:${key}`;
};

const mountForm = (): ContactForm => {
  let captured: ContactForm | undefined;

  const host = defineComponent({
    setup: () => {
      captured = useContactForm(translate);

      return () => {
        return null;
      };
    },
  });

  mount(host, { global: { plugins: [dataProvider] } });

  if (captured === undefined) {
    throw new Error('The composable did not run.');
  }

  return captured;
};

const submitEvent = (): Event => {
  const event = new Event('submit', { cancelable: true });

  return event;
};

describe('useContactForm', () => {
  it('names each field through the translate it is given', () => {
    const form = mountForm();
    const labels = [form.fields.email.label, form.fields.message.label];

    expect(labels).toStrictEqual(['t:contactEmail', 't:contactMessage']);
  });

  it('translates the rule a left field breaks', async () => {
    const form = mountForm();

    form.set('email', 'not-an-address');
    form.blur('email');

    await vi.waitFor(() => {
      expect(form.fields.email.error).toBe('t:contactEmailInvalid');
    });
  });

  it('holds a send until the rules pass', async () => {
    const form = mountForm();

    form.onSubmit(submitEvent());

    await vi.waitFor(() => {
      expect(form.canSubmit).toBe(false);
    });

    expect(form.sent).toBe(false);
  });

  it('sends valid values without letting the event through', async () => {
    const form = mountForm();
    const event = submitEvent();

    form.set('email', 'someone@example.com');
    form.set('message', 'Ten characters, at least.');
    form.onSubmit(event);

    await vi.waitFor(() => {
      expect(form.sent).toBe(true);
    });

    expect(event.defaultPrevented).toBe(true);
  });
});
