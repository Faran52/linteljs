import { defineNuxtPlugin } from 'nuxt/app';

import { dataProvider } from '@lib/providers/data/dataProvider';

export default defineNuxtPlugin((nuxtApp) => {
  dataProvider(nuxtApp.vueApp);
});
