import { type Accessor, createSignal } from 'solid-js';

import { createForm } from '@tanstack/solid-form';

import {
  type ContactValues,
  useSubmitContact,
  validateContact,
} from '@apis/contact';

import type { TextInputProps } from '@ui';

// Named: `createForm` takes its options through a getter, which gives TypeScript no contextual type.
interface ContactSubmission {
  value: ContactValues;
}

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
export const useContactForm = (): ContactForm => {
  const [sent, setSent] = createSignal(false);
  const submit = useSubmitContact();
  const form = createForm(() => {
    return {
      defaultValues: {
        email: '',
        message: '',
      },
      validators: {
        // Every change re-runs the rules; a field shows its result only once it is left.
        onChange: ({ value }: ContactSubmission) => {
          const found = validateContact(value);

          return Object.keys(found).length > 0 ? { fields: found } : undefined;
        },
      },
      onSubmit: async ({ value }: ContactSubmission) => {
        await submit(value);
        setSent(true);
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
        return state().values[name];
      },
      get error() {
        // Read inline: `errors` is an `any[]`, so naming its first element would be an unsafe assignment.
        const meta = state().fieldMeta[name];

        if (meta === undefined || (!meta.isBlurred && state().submissionAttempts === 0)) {
          return undefined;
        }

        return meta.errors[0] === undefined ? undefined : String(meta.errors[0]);
      },
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
    };
  };

  return {
    fields: {
      email: field('email', 'Email', { type: 'email' }),
      message: field('message', 'Message', { multiline: true }),
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
};
