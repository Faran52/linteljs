import { VueQueryPlugin } from '@tanstack/vue-query';

import type { App } from 'vue';

// One client for the application, made by the plugin and installed on the app.
export const installData = (app: App): void => {
  app.use(VueQueryPlugin);
};
