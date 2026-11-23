import { startTransition } from 'react';

import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';

import { type ContactKey, type ContactValues } from '@services/contact-form/contactFormService';
import { type ContactResult } from '@apis/contact/contactEndpoints';

import { type ContactForm, useContactForm } from './useContactForm';

interface FormResult {
  readonly current: ContactForm;
}

const submit = vi.hoisted(() => {
  return vi.fn<(values: ContactValues) => Promise<ContactResult>>();
});

vi.mock('@apis/contact', () => {
  const mocked = {
    useSubmitContact: () => {
      return submit;
    },
  };

  return mocked;
});

const VALID = {
  email: 'someone@example.com',
  message: 'Ten characters, at least.',
};

const translate = (key: ContactKey): string => {
  return `t:${key}`;
};

const renderForm = (): FormResult => {
  const { result } = renderHook(() => {
    return useContactForm(translate);
  });

  return result;
};

const fillValid = (form: FormResult): void => {
  act(() => {
    form.current.fields.email.onChange(VALID.email);
    form.current.fields.message.onChange(VALID.message);
  });
};

const send = (form: FormResult): void => {
  act(() => {
    startTransition(() => {
      form.current.action();
    });
  });
};

describe('useContactForm', () => {
  beforeEach(() => {
    submit.mockReset();
    submit.mockResolvedValue({ status: 200 });
  });

  it('names each field through the translate it is given', () => {
    const form = renderForm();
    const labels = [form.current.fields.email.label, form.current.fields.message.label];

    expect(labels).toStrictEqual(['t:contactEmail', 't:contactMessage']);
  });

  it('translates the rule a left field breaks', async () => {
    const form = renderForm();

    act(() => {
      form.current.fields.email.onChange('not-an-address');
    });

    act(() => {
      form.current.fields.email.onBlur?.();
    });

    await waitFor(() => {
      expect(form.current.fields.email.error).toBe('t:contactEmailInvalid');
    });
  });

  it('holds a send until the rules pass', async () => {
    const form = renderForm();

    send(form);

    await waitFor(() => {
      expect(form.current.canSubmit).toBe(false);
    });

    expect(form.current.sent).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it('sends valid values, submitting until the answer', async () => {
    const { promise, resolve } = Promise.withResolvers<ContactResult>();
    const form = renderForm();

    submit.mockReturnValue(promise);
    fillValid(form);
    send(form);

    await waitFor(() => {
      expect(form.current.submitting).toBe(true);
    });

    expect(submit).toHaveBeenCalledWith(VALID);

    await act(async () => {
      resolve({ status: 200 });
      await promise;
    });

    await waitFor(() => {
      expect(form.current.sent).toBe(true);
    });

    expect(form.current.submitting).toBe(false);
  });
});
