import { useState } from 'react';
import {
  type Control,
  useController,
  useForm,
} from 'react-hook-form';

import {
  type ContactValues,
  errorText,
  type Translate,
  useSubmitContact,
  validateContact,
} from '@apis/contact';

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

interface FieldOptions {
  control: Control<ContactValues>;
  name: keyof ContactValues;
  label: string;
  translate: Translate;
  multiline?: boolean;
  type?: 'text' | 'email';
}

// `useController`: the input is controlled, and `register` spreads onto an uncontrolled element.
const useField = ({
  control,
  name,
  label,
  translate,
  multiline = false,
  type = 'text',
}: FieldOptions): TextInputProps => {
  const { field, fieldState } = useController({
    control,
    name,
  });

  const props = {
    id: name,
    label,
    multiline,
    type,
    value: field.value,
    error: errorText(fieldState.error?.message, translate),
    onBlur: field.onBlur,
    onChange: field.onChange,
  };

  return props;
};

// `translate` names the labels and rules: the page's own `t`, or the English beside the rules.
export const useContactForm = (translate: Translate): ContactForm => {
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
          const entry = [name, {
            type: 'validate',
            message,
          }] as const;

          return entry;
        }));

      const result = {
        errors,
        values: Object.keys(found).length > 0 ? {} : values,
      };

      return result;
    },
  });

  const contactForm: ContactForm = {
    fields: {
      email: useField({
        control,
        name: 'email',
        label: translate('contactEmail'),
        translate,
        type: 'email',
      }),
      message: useField({
        control,
        name: 'message',
        label: translate('contactMessage'),
        translate,
        multiline: true,
      }),
    },
    sent,
    submitting: formState.isSubmitting,
    canSubmit: !formState.isSubmitted || formState.isValid,
    // Wrapped: `handleSubmit` answers a promise-returning handler, which `no-misused-promises` refuses.
    onSubmit: (event) => {
      event.preventDefault();

      void handleSubmit(async (values) => {
        await submit(values);
        setSent(true);
      })();
    },
  };

  return contactForm;
};
