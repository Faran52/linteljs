import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/*
 * Development only, and started from the entry behind an `import.meta.env.DEV` check so a production bundle never
 * carries it. The worker file itself is `public/mockServiceWorker.js`, which MSW copies there on install through
 * the `msw.workerDirectory` key in `package.json`.
 */
export const worker = setupWorker(...handlers);
