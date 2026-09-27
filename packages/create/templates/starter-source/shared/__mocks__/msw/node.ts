import { setupServer } from 'msw/node';

import { handlers } from './handlers';

// `node` whatever the environment: happy-dom has no service worker.
export const server = setupServer(...handlers);
