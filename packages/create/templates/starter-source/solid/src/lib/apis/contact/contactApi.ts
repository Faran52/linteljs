import { type ContactResult, submitContact } from './submission';

import type { ContactValues } from './schemas';

export const createSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  return submitContact;
};
