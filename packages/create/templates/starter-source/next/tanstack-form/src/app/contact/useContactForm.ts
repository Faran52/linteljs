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

/*
 * A client component's hook, which is why the directive is here: it is state, and state is the browser's.
 *
 * The one place the form answer is visible. It hands the page a field per input and a submit, and the page never
 * knows which library bound them, which is what lets the answer change without the page changing with it.
 *
 * The rules come from `lib/apis/contact`, so the form and the api agree about what is valid by reading the same
 * function rather than each carrying a copy of it.
 */
export const useContactForm = (): ContactForm => {
  const [sent, setSent] = useState(false);
  const submit = useSubmitContact();
  const form = useForm({
    defaultValues: {
      email: '',
      message: '',
    } satisfies ContactValues as ContactValues,
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

  /*
   * One subscription, and every field read off it. `getFieldValue` and `getFieldMeta` are plain reads on the
   * form's store, so a field built from them renders its first value and never moves again: nothing tells React
   * the store changed.
   */
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
        /*
         * `validateField` answers the errors or a promise of them, and that union satisfies neither rule: left
         * alone it may be a floating promise, and `void` is refused on a value that might not be one. Wrapping
         * settles which it is.
         */
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
