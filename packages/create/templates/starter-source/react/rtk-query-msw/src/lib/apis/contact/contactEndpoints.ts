import { baseApi } from '../base/baseApi';

import type { ContactValues } from '@services/contact-form/contactFormService';

export interface ContactResult {
  status: number;
}

// Injected into `baseApi`: a second `createApi` is a second cache its tags cannot reach.
// A real request, which MSW answers from `__mocks__/msw/handlers.ts` in development and in the suites.
export const contactEndpoints = baseApi.injectEndpoints({
  endpoints: (build) => {
    const endpoints = {
      submitContact: build.mutation<ContactResult, ContactValues>({
        query: (values) => {
          const args = {
            url: 'contact',
            method: 'POST',
            body: values,
          };

          return args;
        },
      }),
    };

    return endpoints;
  },
});
