import { ref } from 'vue';

import { useForm } from '@tanstack/vue-form';

import { useSubmitContact, validateContact } from '../lib/apis/contact';

import type { TextInputProps } from '../components/ui/text-input/types';
import type { ContactValues } from '../lib/apis/contact';

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
  set: (name: keyof ContactValues, value: string) => void;
  blur: (name: keyof ContactValues) => void;
  onSubmit: (event: Event) => void;
}

/*
 * The one place the form answer is visible. It hands the view a field per input and a submit, and the view never
 * knows which library bound them, which is what lets the answer change without the view changing with it.
 *
 * The rules come from `lib/apis/contact`, so the form and the api agree about what is valid by reading the same
 * function rather than each carrying a copy of it.
 *
 * Every read is a getter over one `useSelector`: that ref is the only read of this library Vue tracks, so a plain
 * `form.getFieldValue` would render the first value and never move again.
 */
export const useContactForm = (): ContactForm => {
  const sent = ref(false);
  const submit = useSubmitContact();
  const form = useForm({
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
      sent.value = true;
    },
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
        return state.value.values[name];
      },
      get error() {
        // Read inline: `errors` is an `any[]`, so naming its first element would be an unsafe assignment.
        const meta = state.value.fieldMeta[name];

        return meta?.errors[0] === undefined ? undefined : String(meta.errors[0]);
      },
    };
  };

  return {
    fields: {
      email: field('email', 'Email', { type: 'email' }),
      message: field('message', 'Message', { multiline: true }),
    },
    get sent() {
      return sent.value;
    },
    get canSubmit() {
      return state.value.canSubmit;
    },
    set: (name, value) => {
      form.setFieldValue(name, value);
    },
    blur: (name) => {
      /*
       * `validateField` answers the errors or a promise of them, and that union satisfies neither rule: left
       * alone it may be a floating promise, and `void` is refused on a value that might not be one. Wrapping
       * settles which it is.
       */
      void Promise.resolve(form.validateField(name, 'blur'));
    },
    onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    },
  };
};
