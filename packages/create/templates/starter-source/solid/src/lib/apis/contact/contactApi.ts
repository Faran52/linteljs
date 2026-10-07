import { type ContactResult, submitContact } from './contactEndpoints';

import type { ContactValues } from '@services/contact-form/contactFormService';

export const createSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
