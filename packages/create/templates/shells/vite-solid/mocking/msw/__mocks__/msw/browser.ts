import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

// Started in development only, from the entry, so a production bundle never runs it.
export const worker = setupWorker(...handlers);
