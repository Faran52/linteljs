import { createSignal } from 'solid-js';

import { createForm } from '@tanstack/solid-form';

import { useSubmitContact, validateContact } from '../../lib/apis/contact';

import type { Accessor } from 'solid-js';
import type { TextInputProps } from '../../components/ui';
import type { ContactValues } from '../../lib/apis/contact';

// What this library hands a validator and a submit; named because `createForm` takes its options through a getter
// and TypeScript has no contextual type to infer them from there.
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

/*
 * The one place the form answer is visible. It hands the page a field per input and a submit, and the page never
 * knows which library bound them, which is what lets the answer change without the page changing with it.
 *
 * The rules come from `lib/apis/contact`, so the form and the api agree about what is valid by reading the same
 * function rather than each carrying a copy of it.
 *
 * Every field is a getter, and the state behind them is one `useSelector`: that is the only read of this library
 * Solid tracks, so a plain `form.getFieldValue` would render the first value and never move again.
 */
export const useContactForm = (): ContactForm => {
  const [sent, setSent] = createSignal(false);
  const submit = useSubmitContact();
  const form = createForm(() => {
    return {
      defaultValues: {
        email: '',
        message: '',
      } satisfies ContactValues as ContactValues,
      validators: {
        onBlur: ({ value }: ContactSubmission) => {
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
  const state = form.useSelector((current) => {
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

        return meta?.errors[0] === undefined ? undefined : String(meta.errors[0]);
      },
      onBlur: () => {
        /*
         * `validateField` answers the errors or a promise of them, and that union satisfies neither rule: left
         * alone it may be a floating promise, and `void` is refused on a value that might not be one. Wrapping
         * settles which it is.
         */
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
    sent,
    canSubmit: () => {
      return state().canSubmit;
    },
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };
};
