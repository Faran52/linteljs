import { http, HttpResponse } from 'msw';

import { type ContactValues, validateContact } from '../../src/lib/apis/contact/schemas';

/*
 * The one description of what the api answers, read by the browser worker in development and by the request
 * interceptor in the test run. There is no second copy and no fixture file: a test that wants a different answer
 * overrides a handler for its own duration rather than mocking the module underneath it.
 *
 * The contact endpoint is here rather than in the base handlers because the route it answers exists only where a
 * form does, and a handler for a page nobody generated is a handler nobody can reach.
 */
export const handlers = [
  http.get('/api/version', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  /*
   * Validated here as well as in the form, on purpose. A server that trusts its client is the defect this starter
   * should not teach, and it is what makes the unhappy path reachable from a test without touching the form.
   */
  http.post('/api/contact', async ({ request }) => {
    const values = await request.json() as ContactValues;
    const errors = validateContact(values);

    if (Object.keys(errors).length > 0) {
      return HttpResponse.json({ errors }, { status: 422 });
    }

    return HttpResponse.json({ status: 'accepted' }, { status: 202 });
  }),
];
