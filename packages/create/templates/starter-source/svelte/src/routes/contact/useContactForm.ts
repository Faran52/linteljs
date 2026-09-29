import { createForm } from '@tanstack/svelte-form';

import type { TextInputProps } from '../../components/ui/text-input/types';

import {
  type ContactValues,
  useSubmitContact,
  validateContact,
} from '$lib/apis/contact';

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
  onSubmit: (event: SubmitEvent) => void;
}

// Every read is a getter over one `useSelector`, the only read of this library Svelte tracks.
export const useContactForm = (): ContactForm => {
  const submit = useSubmitContact();
  const form = createForm(() => {
    return {
      defaultValues: {
        email: '',
        message: '',
      },
      validators: {
        onBlur: ({ value }: ContactSubmission) => {
          const found = validateContact(value);

          return Object.keys(found).length > 0 ? { fields: found } : undefined;
        },
      },
      onSubmit: async ({ value }: ContactSubmission) => {
        await submit(value);
      },
    };
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
    return {
      id: name,
      label,
      ...extra,
      get value() {
        return state.current.values[name];
      },
      get error() {
        // Read inline: `errors` is an `any[]`, so naming its first element would be an unsafe assignment.
        const meta = state.current.fieldMeta[name];

        return meta?.errors[0] === undefined ? undefined : String(meta.errors[0]);
      },
      onBlur: () => {
        // `validateField` answers errors or a promise of them; wrapping settles which for the promise rules.
        void Promise.resolve(form.validateField(name, 'blur'));
      },
      onChange: (value) => {
        form.setFieldValue(name, value);
      },
    };
  };

  return {
    fields: {
      email: field('email', 'Email', { type: 'email' }),
      message: field('message', 'Message', { multiline: true }),
    },
    get sent() {
      return state.current.isSubmitSuccessful;
    },
    get canSubmit() {
      return state.current.canSubmit;
    },
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };
};
