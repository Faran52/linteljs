import { type ContactValues, validateContact } from '../contact-form/contactFormService';

export interface ContactResult {
  status: number;
}

// Local: with no mock server, a starter that posted somewhere would fail offline and in CI.
export const submitContact = async (values: ContactValues): Promise<ContactResult> => {
  const errors = validateContact(values);

  if (Object.keys(errors).length > 0) {
    throw new Error('Contact details are not valid');
  }

  return await Promise.resolve({ status: 200 });
};
