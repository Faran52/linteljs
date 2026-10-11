import { createComponent, type JSX } from 'solid-js';
import { render, waitFor } from '@solidjs/testing-library';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { type ContactKey } from '@services/contact-form/contactFormService';

import { type ContactForm, createContactForm } from './createContactForm';

const translate = (key: ContactKey): string => {
  return `t:${key}`;
};

const renderForm = (): ContactForm => {
  let captured: ContactForm | undefined;

  const host = (): JSX.Element => {
    captured = createContactForm(translate);

    return null;
  };

  render(() => {
    return createComponent(DataProvider, {
      get children() {
        return createComponent(host, {});
      },
    });
  });

  if (captured === undefined) {
    throw new Error('The primitive did not run.');
  }

  return captured;
};

const submitEvent = (): SubmitEvent => {
  const event = new SubmitEvent('submit', { cancelable: true });

  return event;
};

describe('createContactForm', () => {
  it('names each field through the translate it is given', () => {
    const form = renderForm();
    const labels = [form.fields.email.label, form.fields.message.label];

    expect(labels).toStrictEqual(['t:contactEmail', 't:contactMessage']);
  });

  it('translates the rule a left field breaks', async () => {
    const form = renderForm();

    form.fields.email.onChange('not-an-address');
    form.fields.email.onBlur?.();

    await waitFor(() => {
      expect(form.fields.email.error).toBe('t:contactEmailInvalid');
    });
  });

  it('holds a send until the rules pass', async () => {
    const form = renderForm();
    const event = submitEvent();

    form.onSubmit(event);

    await waitFor(() => {
      const open = form.canSubmit();

      expect(open).toBe(false);
    });

    const sent = form.sent();

    expect(sent).toBe(false);
  });

  it('sends valid values without letting the event through', async () => {
    const form = renderForm();
    const event = submitEvent();

    form.fields.email.onChange('someone@example.com');
    form.fields.message.onChange('Ten characters, at least.');
    form.onSubmit(event);

    await waitFor(() => {
      const sent = form.sent();

      expect(sent).toBe(true);
    });

    expect(event.defaultPrevented).toBe(true);
  });
});
