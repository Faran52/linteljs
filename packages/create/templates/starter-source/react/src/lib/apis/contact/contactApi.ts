import { useCallback } from 'react';

import { type ContactValues, validateContact } from './schemas';

export interface ContactResult {
  status: number;
}

// Local: a starter that posted somewhere would fail offline, in CI, and on targets with no server.
export const submitContact = async (values: ContactValues): Promise<ContactResult> => {
  const errors = validateContact(values);

  if (Object.keys(errors).length > 0) {
    throw new Error('Contact details are not valid');
  }

  return await Promise.resolve({ status: 200 });
};

// A hook by contract: the TanStack Query and RTK Query spellings of this file have to be one.
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return useCallback(async (values: ContactValues) => {
    return await submitContact(values);
  }, []);
};
