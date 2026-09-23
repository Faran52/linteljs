import { createMutation } from '@tanstack/svelte-query';

import { type ContactValues, validateContact } from './schemas';

export interface ContactResult {
  status: number;
}

/*
 * Local, and touching no network. A starter that posted somewhere would fail offline, fail in CI, and fail in the
 * five targets that have no server at all; what is worth demonstrating is the layer, not the request.
 */
export const submitContact = async (values: ContactValues): Promise<ContactResult> => {
  const errors = validateContact(values);

  if (Object.keys(errors).length > 0) {
    throw new Error('Contact details are not valid');
  }

  return await Promise.resolve({ status: 200 });
};

/*
 * One shape whatever the data answer is, so the form takes a submit and never knows which layer runs it. Here it
 * is a mutation, which is what puts the call in the cache and gives it a retry.
 */
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const mutation = createMutation(() => {
    return { mutationFn: submitContact };
  });

  return async (values) => {
    return await mutation.mutateAsync(values);
  };
};
