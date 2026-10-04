import { createPinia } from 'pinia';

import type { App } from 'vue';

// Pinia is installed on the app rather than read from a hook, which is why this provider is a function.
export const storeProvider = (app: App): void => {
  app.use(createPinia());
};
