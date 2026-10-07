import { useCallback } from 'react';

import {
  type ContactResult,
  type ContactValues,
  submitContact,
} from '@services/contact-form/contactFormService';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return useCallback(async (values: ContactValues) => {
    return await submitContact(values);
  }, []);
};
