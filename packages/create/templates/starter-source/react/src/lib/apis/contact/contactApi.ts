import { useCallback } from 'react';

import { type ContactResult, submitContact } from './submission';

import type { ContactValues } from './schemas';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return useCallback(async (values: ContactValues) => {
    return await submitContact(values);
  }, []);
};
