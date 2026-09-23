import { createPinia } from 'pinia';

import type { App } from 'vue';

// Pinia is installed on the app rather than read from a hook, which is why this slot is a function.
export const installStore = (app: App): void => {
  app.use(createPinia());
};
