import { render } from '@testing-library/svelte';

import WithContactForm from '@mocks/WithContactForm.svelte';

import type { ContactKey } from '#lib/services/contact-form/contactFormService.ts';
import type { ContactForm } from './useContactForm';

const translate = (key: ContactKey): string => {
  return `t:${key}`;
};

const renderForm = (): ContactForm => {
  let captured: ContactForm | undefined;

  render(WithContactForm, {
    translate,
    capture: (form: ContactForm) => {
      captured = form;
    },
  });

  if (captured === undefined) {
    throw new Error('The hook did not run.');
  }

  return captured;
};

const submitEvent = (): SubmitEvent => {
  const event = new SubmitEvent('submit', { cancelable: true });

  return event;
};

describe('useContactForm', () => {
  it('names each field through the translate it is given', () => {
    const form = renderForm();
    const labels = [form.fields.email.label, form.fields.message.label];

    expect(labels).toStrictEqual(['t:contactEmail', 't:contactMessage']);
  });

  it('shows no error on a field not yet left', () => {
    const form = renderForm();

    form.fields.email.onChange('not-an-address');

    expect(form.fields.email.error).toBeUndefined();
  });

  it('translates the rule a left field breaks', async () => {
    const form = renderForm();

    form.fields.email.onChange('not-an-address');
    form.fields.email.onBlur?.();

    await vi.waitFor(() => {
      expect(form.fields.email.error).toBe('t:contactEmailInvalid');
    });

    expect(form.fields.email.value).toBe('not-an-address');
  });

  it('holds a send until the rules pass', async () => {
    const form = renderForm();

    expect(form.canSubmit).toBe(true);

    form.onSubmit(submitEvent());

    await vi.waitFor(() => {
      expect(form.canSubmit).toBe(false);
    });

    expect(form.sent).toBe(false);
  });

  it('sends valid values without letting the event through', async () => {
    const form = renderForm();
    const event = submitEvent();

    form.fields.email.onChange('someone@example.com');
    form.fields.message.onChange('Ten characters, at least.');
    form.onSubmit(event);

    await vi.waitFor(() => {
      expect(form.sent).toBe(true);
    });

    expect(event.defaultPrevented).toBe(true);
  });
});
