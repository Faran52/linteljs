import {
  type ContactResult,
  type ContactValues,
  submitContact,
} from '@services/contact-form/contactFormService';

export const createSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
