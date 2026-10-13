import { type Accessor, createSignal } from 'solid-js';

import { createForm } from '@tanstack/solid-form';

import {
  type ContactKey,
  type ContactSubmission,
  type ContactValues,
  errorText,
  type Translate,
  validateContactForm,
} from '@services/contact-form/contactFormService';
import { createSubmitContact } from '@apis/contact';

import type { TextInputProps } from '@ui';

export interface ContactFields {
  email: TextInputProps;
  message: TextInputProps;
}

export interface ContactForm {
  fields: ContactFields;
  sent: Accessor<boolean>;
  canSubmit: Accessor<boolean>;
  onSubmit: (event: SubmitEvent) => void;
}

// One `useSelector` behind every getter: it is the only read of this library Solid tracks.
// `translate` names the labels and rules: the page's own `t`, or the English beside the rules.
export const createContactForm = (translate: Translate): ContactForm => {
  const [sent, setSent] = createSignal(false);
  const submit = createSubmitContact();
  const form = createForm(() => {
    const options = {
      defaultValues: {
        email: '',
        message: '',
      },
      validators: {
        // Every change re-runs the rules; a field shows its result only once it is left.
        onChange: validateContactForm,
      },
      onSubmit: async ({ value }: ContactSubmission) => {
        await submit(value);
        setSent(true);
      },
    };

    return options;
  });
  const state = form
    .useSelector((current) => {
      return current;
    });

  const field = (
    name: keyof ContactValues,
    label: ContactKey,
    extra: Partial<TextInputProps> = {},
  ): TextInputProps => {
    const props: TextInputProps = {
      id: name,
      ...extra,
      get label() {
        return translate(label);
      },
      get value() {
        return state().values[name];
      },
      get error() {
        const meta = state().fieldMeta[name];

        if (meta === undefined || (!meta.isBlurred && state().submissionAttempts === 0)) {
          return undefined;
        }

        const found = String(meta.errors[0]);

        return errorText(found, translate);
      },
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
    };

    return props;
  };

  const contactForm: ContactForm = {
    fields: {
      email: field('email', 'contactEmail', { type: 'email' }),
      message: field('message', 'contactMessage', { multiline: true }),
    },
    sent,
    canSubmit: () => {
      // Open until a send is tried, which names what is missing; then held until the rules pass.
      return state().submissionAttempts === 0 || state().canSubmit;
    },
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };

  return contactForm;
};
