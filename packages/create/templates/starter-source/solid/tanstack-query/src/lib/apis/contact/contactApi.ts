import { useMutation } from '@tanstack/solid-query';

import { type ContactResult, submitContact } from './submission';

import type { ContactValues } from './schemas';

// A mutation, which puts the call in the cache and gives it a retry.
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const mutation = useMutation(() => {
    const options = { mutationFn: submitContact };

    return options;
  });

  return async (values) => {
    return await mutation.mutateAsync(values);
  };
};
