import {
  afterAll,
  afterEach,
  beforeAll,
} from 'vitest';

import { server } from './msw/node';

// `onUnhandledRequest: 'error'`: a request with no handler is a test reaching the network.
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
