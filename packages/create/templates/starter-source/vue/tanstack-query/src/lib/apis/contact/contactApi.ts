import { useMutation } from '@tanstack/vue-query';

import {
  type ContactResult,
  type ContactValues,
  submitContact,
} from '@services/contact-form/contactFormService';

// A mutation, which puts the call in the cache and gives it a retry.
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const mutation = useMutation({ mutationFn: submitContact });

  return async (values) => {
    return await mutation.mutateAsync(values);
  };
};
