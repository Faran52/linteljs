import {
  afterAll,
  afterEach,
  beforeAll,
} from 'vitest';

import { server } from './msw/node';

/*
 * One interceptor for the whole run, so a suite makes the request the application makes and a handler answers it.
 *
 * `onUnhandledRequest: 'error'` on purpose: a request nobody wrote a handler for is a test reaching the network,
 * which is the failure this layer exists to make impossible rather than something to let through quietly.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Between tests, so a handler one test overrode does not leak into the next.
afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
