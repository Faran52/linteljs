import { VueQueryPlugin } from '@tanstack/vue-query';

import type { App } from 'vue';

export const dataProvider = (app: App): void => {
  app.use(VueQueryPlugin);
};
