import { ref } from 'vue';

import { useForm } from '@tanstack/vue-form';

import {
  type ContactKey,
  type ContactSubmission,
  type ContactValues,
  errorText,
  type Translate,
  validateContactForm,
} from '@services/contact-form/contactFormService';
import { useSubmitContact } from '@apis/contact';

import type { TextInputProps } from '@ui/text-input/types';

export interface ContactFields {
  email: TextInputProps;
  message: TextInputProps;
}

export interface ContactForm {
  fields: ContactFields;
  readonly sent: boolean;
  readonly canSubmit: boolean;
  set: (name: keyof ContactValues, value: string) => void;
  blur: (name: keyof ContactValues) => void;
  onSubmit: (event: Event) => void;
}

// Every read is a getter over one `useSelector`, the only read of this library Vue tracks. `translate` names the
// labels and rules: the page's own `t`, or the English beside the rules.
export const useContactForm = (translate: Translate): ContactForm => {
  const sent = ref(false);
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
    onSubmit: async ({ value }: ContactSubmission) => {
      await submit(value);
      sent.value = true;
    },
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
        return state.value.values[name];
      },
      get error() {
        const meta = state.value.fieldMeta[name];

        if (meta === undefined || (!meta.isBlurred && state.value.submissionAttempts === 0)) {
          return undefined;
        }

        const found = String(meta.errors[0]);

        return errorText(found, translate);
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
      return sent.value;
    },
    get canSubmit() {
      // Open until a send is tried, which names what is missing; then held until the rules pass.
      return state.value.submissionAttempts === 0 || state.value.canSubmit;
    },
    set: (name, value) => {
      form.setFieldValue(name, value);
    },
    blur: (name) => {
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
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };

  return contactForm;
};
