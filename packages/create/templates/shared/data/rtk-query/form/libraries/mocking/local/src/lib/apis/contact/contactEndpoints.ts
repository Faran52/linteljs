import { type ContactValues, validateContact } from '@services/contact-form/contactFormService';

import { baseApi } from '../base/baseApi';

import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

export interface ContactResult {
  status: number;
}

type ContactOutcome = QueryReturnValue<ContactResult, FetchBaseQueryError, FetchBaseQueryMeta>;

// Injected into `baseApi`: a second `createApi` is a second cache its tags cannot reach.
// `queryFn`: the documented place for an endpoint that is not a request, so this stays offline.
export const contactEndpoints = baseApi.injectEndpoints({
  endpoints: (build) => {
    const endpoints = {
      submitContact: build.mutation<ContactResult, ContactValues>({
        queryFn: (values) => {
          const errors = validateContact(values);

          // `CUSTOM_ERROR` is the arm for an error no request produced.
          const result: ContactOutcome = Object.keys(errors).length > 0
            ? {
                error: {
                  status: 'CUSTOM_ERROR',
                  error: 'Contact details are not valid',
                },
              }
            : { data: { status: 200 } };

          return result;
        },
      }),
    };

    return endpoints;
  },
});
