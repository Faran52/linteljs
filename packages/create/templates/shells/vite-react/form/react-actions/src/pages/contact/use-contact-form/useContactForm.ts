import { useActionState, useState } from 'react';

import {
  type ContactValues,
  errorText,
  type Translate,
  validateContact,
} from '@services/contact-form/contactFormService';
import { useSubmitContact } from '@apis/contact';

import type { TextInputProps } from '@ui';

export interface ContactFields {
  email: TextInputProps;
  message: TextInputProps;
}

export interface ContactForm {
  fields: ContactFields;
  sent: boolean;
  submitting: boolean;
  canSubmit: boolean;
  action: () => void;
}

type Stage = 'open' | 'refused' | 'sent';

// `translate` names the labels and rules: the page's own `t`, or the English beside the rules.
export const useContactForm = (translate: Translate): ContactForm => {
  const [values, setValues] = useState<ContactValues>({
    email: '',
    message: '',
  });
  const [left, setLeft] = useState({
    email: false,
    message: false,
  });
  const submit = useSubmitContact();
  const errors = validateContact(values);
  const valid = Object.keys(errors).length === 0;

  const [
    stage,
    action,
    submitting,
  ] = useActionState<Stage>(async () => {
    if (!valid) {
      return 'refused';
    }

    await submit(values);

    return 'sent';
  }, 'open');

  const field = (
    name: keyof ContactValues,
    label: string,
    extra: Partial<TextInputProps>,
  ): TextInputProps => {
    const shown = left[name] || stage === 'refused';

    const props: TextInputProps = {
      id: name,
      label,
      value: values[name],
      error: shown ? errorText(errors[name], translate) : undefined,
      onBlur: () => {
        setLeft((current) => {
          const next = {
            ...current,
            [name]: true,
          };

          return next;
        });
      },
      onChange: (value) => {
        setValues((current) => {
          const next = {
            ...current,
            [name]: value,
          };

          return next;
        });
      },
      ...extra,
    };

    return props;
  };

  const emailLabel = translate('contactEmail');
  const messageLabel = translate('contactMessage');
  const contactForm: ContactForm = {
    fields: {
      email: field('email', emailLabel, { type: 'email' }),
      message: field('message', messageLabel, { multiline: true }),
    },
    sent: stage === 'sent',
    submitting,
    // Open until a send is tried, which names what is missing; then held until the rules pass.
    canSubmit: stage === 'open' || valid,
    action,
  };

  return contactForm;
};
