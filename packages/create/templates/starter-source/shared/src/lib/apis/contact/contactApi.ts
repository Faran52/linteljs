import {
  type ContactResult,
  type ContactValues,
  submitContact,
} from '@services/contact-form/contactFormService';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
