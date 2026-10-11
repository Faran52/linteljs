import { type ContactResult, submitContact } from './contactEndpoints';

import type { ContactValues } from '@services/contact-form/contactFormService';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
