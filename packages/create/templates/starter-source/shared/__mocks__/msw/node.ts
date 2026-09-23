import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/*
 * The test run's half, started once from the setup file. `node` rather than `browser` whatever the environment
 * is: happy-dom has no service worker, so the interception happens at the request rather than at the network.
 */
export const server = setupServer(...handlers);
