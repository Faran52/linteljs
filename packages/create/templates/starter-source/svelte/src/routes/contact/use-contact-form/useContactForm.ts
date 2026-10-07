import { useSubmitContact } from '#lib/apis/contact/index.ts';
import {
  type ContactKey,
  type ContactSubmission,
  type ContactValues,
  errorText,
  type Translate,
  validateContactForm,
} from '#lib/services/contact-form/contactFormService.ts';

import { createForm } from '@tanstack/svelte-form';

import type { TextInputProps } from '@ui/text-input/types';

export interface ContactFields {
  email: TextInputProps;
  message: TextInputProps;
}

export interface ContactForm {
  fields: ContactFields;
  readonly sent: boolean;
  readonly canSubmit: boolean;
  onSubmit: (event: SubmitEvent) => void;
}

// Every read is a getter over one `useSelector`, the only read of this library Svelte tracks. `translate` names the
// labels and rules: the page's own `m`, or the English beside the rules.
export const useContactForm = (translate: Translate): ContactForm => {
  const submit = useSubmitContact();
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
        return state.current.values[name];
      },
      get error() {
        const meta = state.current.fieldMeta[name];

        if (meta === undefined || (!meta.isBlurred && state.current.submissionAttempts === 0)) {
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
    get sent() {
      return state.current.isSubmitSuccessful;
    },
    get canSubmit() {
      // Open until a send is tried, which names what is missing; then held until the rules pass.
      return state.current.submissionAttempts === 0 || state.current.canSubmit;
    },
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };

  return contactForm;
};
