'use client';

import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';

import { useSubmitContact, validateContact } from '../../lib/apis/contact';

import type { SubmitEventHandler } from 'react';
import type { Control } from 'react-hook-form';
import type { TextInputProps } from '../../components/ui';
import type { ContactValues } from '../../lib/apis/contact';

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

interface FieldOptions {
  control: Control<ContactValues>;
  name: keyof ContactValues;
  label: string;
  multiline?: boolean;
  type?: 'text' | 'email';
}

/*
 * `useController` rather than `register`: the input is controlled, and this is the binding React Hook Form offers
 * for one. `register` spreads onto an uncontrolled element and would need the control to be a different shape.
 */
const useField = ({
  control,
  name,
  label,
  multiline = false,
  type = 'text',
}: FieldOptions): TextInputProps => {
  const { field, fieldState } = useController({
    control,
    name,
  });

  return {
    id: name,
    label,
    multiline,
    type,
    value: field.value,
    error: fieldState.error?.message,
    onBlur: field.onBlur,
    onChange: field.onChange,
  };
};

/*
 * A client component's hook, which is why the directive is here: it is state, and state is the browser's.
 *
 * The one place the form answer is visible. It hands the page a field per input and a submit, and the page never
 * knows which library bound them, which is what lets the answer change without the page changing with it.
 *
 * The rules come from `lib/apis/contact` through a resolver, so the form and the api agree about what is valid by
 * reading the same function rather than each carrying a copy of it.
 */
export const useContactForm = (): ContactForm => {
  const [sent, setSent] = useState(false);
  const submit = useSubmitContact();
  const {
    control,
    handleSubmit,
    formState,
  } = useForm<ContactValues>({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      message: '',
    },
    resolver: (values) => {
      const found = validateContact(values);
      const errors = Object.fromEntries(Object.entries(found).map(([name, message]) => {
        return [name, {
          type: 'validate',
          message,
        }];
      }));

      return {
        errors,
        values: Object.keys(found).length > 0 ? {} : values,
      };
    },
  });

  return {
    fields: {
      email: useField({
        control,
        name: 'email',
        label: 'Email',
        type: 'email',
      }),
      message: useField({
        control,
        name: 'message',
        label: 'Message',
        multiline: true,
      }),
    },
    sent,
    submitting: formState.isSubmitting,
    canSubmit: !formState.isSubmitted || formState.isValid,
    /*
     * Wrapped rather than handed over: `handleSubmit` answers a handler that returns a promise, and a submit
     * handler is expected to return nothing, which `no-misused-promises` is right to refuse.
     */
    onSubmit: (event) => {
      void handleSubmit(async (values) => {
        await submit(values);
        setSent(true);
      })(event);
    },
  };
};
