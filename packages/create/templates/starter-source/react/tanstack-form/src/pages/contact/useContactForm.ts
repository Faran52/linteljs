import { type SubmitEventHandler, useState } from 'react';

import { useForm, useSelector } from '@tanstack/react-form';

import {
  type ContactValues,
  useSubmitContact,
  validateContact,
} from '@apis/contact';

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
  // Not `FormEventHandler`: React 19's types deprecate it and name this as what a submit actually takes.
  onSubmit: SubmitEventHandler<HTMLFormElement>;
}

export const useContactForm = (): ContactForm => {
  const [sent, setSent] = useState(false);
  const submit = useSubmitContact();
  const form = useForm({
    defaultValues: {
      email: '',
      message: '',
    },
    validators: {
      // Every change re-runs the rules; a field shows its result only once it is left.
      onChange: ({ value }) => {
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
    const shown = meta !== undefined && (meta.isBlurred || state.submissionAttempts > 0);

    return {
      id: name,
      label,
      value: state.values[name],
      error: !shown || meta.errors[0] === undefined ? undefined : String(meta.errors[0]),
      onBlur: () => {
        form
          .setFieldMeta(name, (prev) => {
            return {
              ...prev,
              isBlurred: true,
            };
          });

        // A field left unchanged has not met the rules yet. `validateField` answers errors or a promise of them;
        // wrapping settles which for the promise rules.
        void Promise.resolve(form.validateField(name, 'change'));
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
    // Open until a send is tried, which names what is missing; then held until the rules pass.
    canSubmit: state.submissionAttempts === 0 || state.canSubmit,
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };
};
