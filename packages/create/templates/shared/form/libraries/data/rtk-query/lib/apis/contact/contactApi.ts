import { contactEndpoints, type ContactResult } from './contactEndpoints';

import type { ContactValues } from '@services/contact-form/contactFormService';

const { useSubmitContactMutation } = contactEndpoints;

// `unwrap` turns the tuple's result back into a promise that rejects, which the form is written against.
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const [trigger] = useSubmitContactMutation();

  return async (values) => {
    return await trigger(values).unwrap();
  };
};
