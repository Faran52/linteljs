import { setupServer } from 'msw/native';

import { handlers } from './handlers';

// Started in development only, from `src/index.ts`, after the polyfills it loads on.
export const server = setupServer(...handlers);
