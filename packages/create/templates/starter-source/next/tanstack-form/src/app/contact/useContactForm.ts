'use client';

import { type SubmitEventHandler, useState } from 'react';

import { useForm, useSelector } from '@tanstack/react-form';

import {
  type ContactValues,
  useSubmitContact,
  validateContact,
} from '../../lib/apis/contact';

import type { TextInputProps } from '../../components/ui';

export interface ContactFields {
  email: TextInputProps;
  message: TextInputProps;
}

export interface ContactForm {
  fields: ContactFields;
  sent: boolean;
  submitting: boolean;
  canSubmit: boolean;
  // Not `FormEventHandler`: React 19's types deprecate it and name this as what a submit actually takes.
  onSubmit: SubmitEventHandler<HTMLFormElement>;
}

// A client component's hook: it is state, and state is the browser's.
export const useContactForm = (): ContactForm => {
  const [sent, setSent] = useState(false);
  const submit = useSubmitContact();
  const form = useForm({
    defaultValues: {
      email: '',
      message: '',
    },
    validators: {
      onBlur: ({ value }) => {
        const found = validateContact(value);

        return Object.keys(found).length > 0 ? { fields: found } : undefined;
      },
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
    extra: Partial<TextInputProps> = {},
  ): TextInputProps => {
    const meta = state.fieldMeta[name];

    return {
      id: name,
      label,
      value: state.values[name],
      error: meta?.errors[0] === undefined ? undefined : String(meta.errors[0]),
      onBlur: () => {
        // `validateField` answers errors or a promise of them; wrapping settles which for the promise rules.
        void Promise.resolve(form.validateField(name, 'blur'));
      },
      onChange: (value) => {
        form.setFieldValue(name, value);
      },
      ...extra,
    };
  };

  return {
    fields: {
      email: field('email', 'Email', { type: 'email' }),
      message: field('message', 'Message', { multiline: true }),
    },
    sent,
    submitting: state.isSubmitting,
    canSubmit: state.canSubmit,
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };
};
