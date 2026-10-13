import { type ContactResult, submitContact } from './contact-endpoints';

import type { ContactValues } from '@services/contact-form/contact-form-service';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
