import { createForm } from '@tanstack/svelte-form';

import type { ContactValues } from '$lib/apis/contact';
import type { TextInputProps } from '../../components/ui/text-input/types';

import { useSubmitContact, validateContact } from '$lib/apis/contact';

// What this library hands a validator and a submit, named because an inline shape cannot be referenced.
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

/*
 * The one place the form answer is visible. It hands the page a field per input and a submit, and the page never
 * knows which library bound them, which is what lets the answer change without the page changing with it.
 *
 * The rules come from `lib/apis/contact`, so the form and the api agree about what is valid by reading the same
 * function rather than each carrying a copy of it.
 *
 * Called from a component's script and nowhere else: `createForm` opens an effect, and every read below is a
 * getter over one `useSelector`, which is the only read of this library Svelte tracks. That is also why `sent` is
 * the library's own flag rather than a rune: a rune would make this a `.svelte.ts` module for one boolean the form
 * already holds.
 */
export const useContactForm = (): ContactForm => {
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
        return state.current.values[name];
      },
      get error() {
        // Read inline: `errors` is an `any[]`, so naming its first element would be an unsafe assignment.
        const meta = state.current.fieldMeta[name];

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
