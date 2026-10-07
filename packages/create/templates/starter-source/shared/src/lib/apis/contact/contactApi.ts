import { type ContactResult, submitContact } from '@services/contact-submit/contactSubmitService';

import type { ContactValues } from '@services/contact-form/contactFormService';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
