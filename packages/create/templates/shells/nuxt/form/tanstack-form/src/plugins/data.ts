import { dataProvider } from '@lib/providers/data/dataProvider';

export default defineNuxtPlugin((nuxtApp) => {
  dataProvider(nuxtApp.vueApp);
});
