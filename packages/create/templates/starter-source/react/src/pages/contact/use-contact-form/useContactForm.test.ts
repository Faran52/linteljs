import {
  createElement,
  type FC,
  type ReactNode,
} from 'react';

import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { type ContactKey } from '@services/contact-form/contactFormService';

import { type ContactForm, useContactForm } from './useContactForm';

interface WrapperProps {
  readonly children: ReactNode;
}

interface FormResult {
  readonly current: ContactForm;
}

const wrapper: FC<WrapperProps> = ({ children }) => {
  const data = createElement(DataProvider, null, children);

  return createElement(StoreProvider, null, data);
};

const translate = (key: ContactKey): string => {
  return `t:${key}`;
};

const renderForm = (): FormResult => {
  const { result } = renderHook(() => {
    return useContactForm(translate);
  }, { wrapper });

  return result;
};

const preventDefault = vi.fn();

describe('useContactForm', () => {
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

    act(() => {
      form.current.onSubmit({ preventDefault });
    });

    await waitFor(() => {
      expect(form.current.canSubmit).toBe(false);
    });

    expect(form.current.sent).toBe(false);
  });

  it('sends valid values without letting the event through', async () => {
    const form = renderForm();

    act(() => {
      form.current.fields.email.onChange('someone@example.com');
      form.current.fields.message.onChange('Ten characters, at least.');
    });

    act(() => {
      form.current.onSubmit({ preventDefault });
    });

    await waitFor(() => {
      expect(form.current.sent).toBe(true);
    });

    expect(preventDefault).toHaveBeenCalled();
  });
});
