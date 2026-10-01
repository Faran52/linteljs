import { type SubmitEventHandler, useState } from 'react';
import {
  type Control,
  useController,
  useForm,
} from 'react-hook-form';

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

interface FieldOptions {
  control: Control<ContactValues>;
  name: keyof ContactValues;
  label: string;
  multiline?: boolean;
  type?: 'text' | 'email';
}

// `useController`: the input is controlled, and `register` spreads onto an uncontrolled element.
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

export const useContactForm = (): ContactForm => {
  const [sent, setSent] = useState(false);
  const submit = useSubmitContact();
  const {
    control,
    handleSubmit,
    formState,
  } = useForm<ContactValues>({
    // Checked once a field is left, then on every change, so a fixed value clears its error at once.
    mode: 'onTouched',
    defaultValues: {
      email: '',
      message: '',
    },
    resolver: (values) => {
      const found = validateContact(values);
      const errors = Object.fromEntries(Object.entries(found)
        .map(([name, message]) => {
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
    // Wrapped: `handleSubmit` answers a promise-returning handler, which `no-misused-promises` refuses.
    onSubmit: (event) => {
      void handleSubmit(async (values) => {
        await submit(values);
        setSent(true);
      })(event);
    },
  };
};
