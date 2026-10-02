import { createMutation } from '@tanstack/svelte-query';

import { type ContactValues, validateContact } from './schemas';

export interface ContactResult {
  status: number;
}

// Local: a starter that posted somewhere would fail offline and in CI.
export const submitContact = async (values: ContactValues): Promise<ContactResult> => {
  const errors = validateContact(values);

  if (Object.keys(errors).length > 0) {
    throw new Error('Contact details are not valid');
  }

  return await Promise.resolve({ status: 200 });
};

// A mutation, which puts the call in the cache and gives it a retry.
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const mutation = createMutation(() => {
    const options = { mutationFn: submitContact };

    return options;
  });

  return async (values) => {
    return await mutation.mutateAsync(values);
  };
};
