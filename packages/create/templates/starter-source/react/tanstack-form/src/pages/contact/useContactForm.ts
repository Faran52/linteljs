import { useState } from 'react';

import { useForm, useSelector } from '@tanstack/react-form';

import {
  type ContactValues,
  errorText,
  type Translate,
  useSubmitContact,
} from '@apis/contact';
import { validateContactForm } from '@apis/contact/formValidator';

import type { TextInputProps } from '@ui';

// A web form's submit and a native press both carry one, so one hook serves `<form>` and `Pressable`.
export interface PreventableEvent {
  preventDefault: () => void;
}

export interface ContactFields {
  email: TextInputProps;
  message: TextInputProps;
}

export interface ContactForm {
  fields: ContactFields;
  sent: boolean;
  submitting: boolean;
  canSubmit: boolean;
  onSubmit: (event: PreventableEvent) => void;
}

// `translate` names the labels and rules: the page's own `t`, or the English beside the rules.
export const useContactForm = (translate: Translate): ContactForm => {
  const [sent, setSent] = useState(false);
  const submit = useSubmitContact();
  const form = useForm({
    defaultValues: {
      email: '',
      message: '',
    },
    validators: {
      // Every change re-runs the rules; a field shows its result only once it is left.
      onChange: validateContactForm,
    },
    onSubmit: async ({ value }) => {
      await submit(value);
      setSent(true);
    },
  });

  // One subscription: `getFieldValue` reads never tell React the store changed.
  const state = useSelector(form.store, (current) => {
    return current;
  });

  const field = (
    name: keyof ContactValues,
    label: string,
    extra: Partial<TextInputProps>,
  ): TextInputProps => {
    const meta = state.fieldMeta[name];
    const shown = meta !== undefined && (meta.isBlurred || state.submissionAttempts > 0);
    const found = shown ? String(meta.errors[0]) : undefined;

    const props: TextInputProps = {
      id: name,
      label,
      value: state.values[name],
      error: errorText(found, translate),
      onBlur: () => {
        form
          .setFieldMeta(name, (prev) => {
            const blurred = {
              ...prev,
              isBlurred: true,
            };

            return blurred;
          });

        // A field left unchanged has not met the rules yet. `validateField` answers errors or a promise of them;
        // wrapping settles which for the promise rules.
        const validation = form.validateField(name, 'change');

        void Promise.resolve(validation);
      },
      onChange: (value) => {
        form.setFieldValue(name, value);
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
    sent,
    submitting: state.isSubmitting,
    // Open until a send is tried, which names what is missing; then held until the rules pass.
    canSubmit: state.submissionAttempts === 0 || state.canSubmit,
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };

  return contactForm;
};
