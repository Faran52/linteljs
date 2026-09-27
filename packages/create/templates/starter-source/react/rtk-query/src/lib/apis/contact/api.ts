import { baseApi } from '../baseApi';

import { type ContactValues, validateContact } from './schemas';

export interface ContactResult {
  status: number;
}

// Injected into `baseApi`: a second `createApi` is a second cache its tags cannot reach.
// `queryFn`: the documented place for an endpoint that is not a request, so this stays offline.
export const contactApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      submitContact: build.mutation<ContactResult, ContactValues>({
        queryFn: (values) => {
          const errors = validateContact(values);

          // `CUSTOM_ERROR` is the arm for an error no request produced.
          return Object.keys(errors).length > 0
            ? {
                error: {
                  status: 'CUSTOM_ERROR',
                  error: 'Contact details are not valid',
                },
              }
            : { data: { status: 200 } };
        },
      }),
    };
  },
});

const { useSubmitContactMutation } = contactApi;

// `unwrap` turns the tuple's result back into a promise that rejects, which the form is written against.
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const [trigger] = useSubmitContactMutation();

  return async (values) => {
    return await trigger(values).unwrap();
  };
};
