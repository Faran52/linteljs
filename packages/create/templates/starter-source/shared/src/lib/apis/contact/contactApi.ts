import { type ContactResult, submitContact } from './submission';

import type { ContactValues } from './schemas';

export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
