import { ref } from 'vue';

import { useForm } from '@tanstack/vue-form';

import {
  type ContactValues,
  useSubmitContact,
  validateContact,
} from '@apis/contact';

import type { TextInputProps } from '@ui/text-input/types';

// Named because an inline shape cannot be referenced.
interface ContactSubmission {
  value: ContactValues;
}

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

// Every read is a getter over one `useSelector`, the only read of this library Vue tracks.
export const useContactForm = (): ContactForm => {
  const sent = ref(false);
  const submit = useSubmitContact();
  const form = useForm({
    defaultValues: {
      email: '',
      message: '',
    },
    validators: {
      // Every change re-runs the rules; a field shows its result only once it is left.
      onChange: ({ value }: ContactSubmission) => {
        const found = validateContact(value);

        const errors = Object.keys(found).length > 0 ? { fields: found } : undefined;

        return errors;
      },
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
    label: string,
    extra: Partial<TextInputProps> = {},
  ): TextInputProps => {
    const props: TextInputProps = {
      id: name,
      label,
      ...extra,
      get value() {
        return state.value.values[name];
      },
      get error() {
        // Read inline: `errors` is an `any[]`, so naming its first element would be an unsafe assignment.
        const meta = state.value.fieldMeta[name];

        if (meta === undefined || (!meta.isBlurred && state.value.submissionAttempts === 0)) {
          return undefined;
        }

        return meta.errors[0] === undefined ? undefined : String(meta.errors[0]);
      },
    };

    return props;
  };

  const contactForm: ContactForm = {
    fields: {
      email: field('email', 'Email', { type: 'email' }),
      message: field('message', 'Message', { multiline: true }),
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
