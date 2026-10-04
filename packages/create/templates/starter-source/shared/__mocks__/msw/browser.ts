import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

// Nothing starts this: start it behind an `import.meta.env.DEV` check, so a production bundle never carries it.
export const worker = setupWorker(...handlers);
