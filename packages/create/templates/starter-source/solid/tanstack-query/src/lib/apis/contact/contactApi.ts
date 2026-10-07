import { useMutation } from '@tanstack/solid-query';

import {
  type ContactResult,
  type ContactValues,
  submitContact,
} from '@services/contact-form/contactFormService';

// A mutation, which puts the call in the cache and gives it a retry.
export const createSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const mutation = useMutation(() => {
    const options = { mutationFn: submitContact };

    return options;
  });

  return async (values) => {
    return await mutation.mutateAsync(values);
  };
};
