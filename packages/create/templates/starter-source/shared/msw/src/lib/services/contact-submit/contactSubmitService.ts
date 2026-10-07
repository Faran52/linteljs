import { request } from '@utils/fetchExtendedUtils';

import type { ContactValues } from '../contact-form/contactFormService';

export interface ContactResult {
  status: number;
}

// A real request, which MSW answers from `__mocks__/msw/handlers.ts` in development and in the suites.
export const submitContact = async (values: ContactValues): Promise<ContactResult> => {
  return await request<ContactResult>('/contact', {
    method: 'POST',
    body: values,
  });
};
