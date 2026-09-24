import { baseApi } from '../baseApi';

import { type ContactValues, validateContact } from './schemas';

export interface ContactResult {
  status: number;
}

/*
 * Injected into `baseApi` rather than opening a second `createApi`. Two of those are two caches, two reducers and
 * two middlewares, and a tag invalidated in one is invisible to the other; injection is the library's own answer
 * and the reason `baseApi` exists.
 *
 * `queryFn` rather than `query`, which is the documented place for an endpoint that is not a request. So this one
 * stays local and touches no network: a starter that posted somewhere would fail offline, fail in CI, and fail on
 * every target with no server behind it. The endpoints that do speak HTTP use `query` and the base's own origin.
 */
export const contactApi = baseApi.injectEndpoints({
  endpoints: (build) => {
    return {
      submitContact: build.mutation<ContactResult, ContactValues>({
        queryFn: (values) => {
          const errors = validateContact(values);

          // `baseApi` is a `fetchBaseQuery`, so an error here is its error type; `CUSTOM_ERROR` is the arm for one
          // that no request produced.
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

/*
 * One shape whatever the data answer is, so the form takes a submit and never knows which layer runs it. The
 * generated hook answers a tuple; `unwrap` turns its result back into a promise that rejects, which is what the
 * form is written against.
 */
export const useSubmitContact = (): ((values: ContactValues) => Promise<ContactResult>) => {
  const [trigger] = useSubmitContactMutation();

  return async (values) => {
    return await trigger(values).unwrap();
  };
};
