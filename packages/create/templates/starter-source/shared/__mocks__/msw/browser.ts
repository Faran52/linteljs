import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

// Behind an `import.meta.env.DEV` check, so a production bundle never carries it.
export const worker = setupWorker(...handlers);
