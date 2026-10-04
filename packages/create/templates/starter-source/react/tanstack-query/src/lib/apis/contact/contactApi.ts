import { useMutation } from '@tanstack/react-query';

import { type ContactResult, submitContact } from './submission';

import type { ContactValues } from './schemas';

// A mutation, which puts the call in the cache and gives it a retry.
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const mutation = useMutation({ mutationFn: submitContact });

  return mutation.mutateAsync;
};
