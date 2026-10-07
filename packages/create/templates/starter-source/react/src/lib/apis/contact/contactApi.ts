import { useCallback } from 'react';

import { type ContactResult, submitContact } from '@services/contact-submit/contactSubmitService';

import type { ContactValues } from '@services/contact-form/contactFormService';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return useCallback(async (values: ContactValues) => {
    return await submitContact(values);
  }, []);
};
