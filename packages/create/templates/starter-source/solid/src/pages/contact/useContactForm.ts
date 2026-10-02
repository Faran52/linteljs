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
    const options = {
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
    label: string,
    extra: Partial<TextInputProps> = {},
  ): TextInputProps => {
    const props: TextInputProps = {
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

  return contactForm;
};
