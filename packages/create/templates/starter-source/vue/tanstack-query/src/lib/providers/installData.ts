import { VueQueryPlugin } from '@tanstack/vue-query';

import type { App } from 'vue';

export const installData = (app: App): void => {
  app.use(VueQueryPlugin);
};
