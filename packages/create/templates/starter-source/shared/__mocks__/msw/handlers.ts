import { http, HttpResponse } from 'msw';

/*
 * The one description of what the api answers, read by the browser worker in development and by the request
 * interceptor in the test run. There is no second copy and no fixture file: a test that wants a different answer
 * overrides a handler for its own duration rather than mocking the module underneath it.
 *
 * Handlers are the reason the api layer can speak HTTP at all in a starter. Without them a project that posts
 * anywhere fails offline, fails in CI, and fails on every target with no server behind it.
 */
export const handlers = [
  http.get('/api/version', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
