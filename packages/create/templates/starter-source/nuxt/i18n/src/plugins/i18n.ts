import { computed } from 'vue';
import {
  defineNuxtPlugin,
  onNuxtReady,
  useHead,
} from 'nuxt/app';

import {
  applyLanguage,
  detectLanguage,
  directionOf,
  i18n,
} from '@i18n';

// The server has neither storage nor the browser, so it renders English and detection waits for hydration.
export default defineNuxtPlugin((nuxtApp) => {
  const { locale } = i18n.global;

  nuxtApp.vueApp.use(i18n);
  useHead({
    htmlAttrs: {
      lang: locale,
      dir: computed(() => {
        return directionOf(locale.value);
      }),
    },
  });
  onNuxtReady(() => {
    applyLanguage(detectLanguage());
  });
});
