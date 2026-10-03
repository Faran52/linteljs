import { computed } from 'vue';
import {
  defineNuxtPlugin,
  useHead,
  useRequestHeaders,
  useState,
} from 'nuxt/app';

import {
  createLanguageI18n,
  detectLanguage,
  directionOf,
  i18n,
} from '@i18n';
import { acceptedTags } from '@i18n/utils/cookieUtils';

// Detected once from the request on the server, then carried to the client in the payload, so hydration matches.
export default defineNuxtPlugin((nuxtApp) => {
  const onServer = nuxtApp.ssrContext !== undefined;
  const language = useState('language', () => {
    if (!onServer) {
      return detectLanguage();
    }

    const headers = useRequestHeaders(['cookie', 'accept-language']);

    const preferred = acceptedTags(headers['accept-language'] ?? '');

    return detectLanguage(headers.cookie ?? '', preferred);
  });
  const instance = onServer ? createLanguageI18n(language.value) : i18n;
  const { locale } = instance.global;

  locale.value = language.value;
  nuxtApp.vueApp.use(instance);

  useHead({
    htmlAttrs: {
      lang: locale,
      dir: computed(() => {
        return directionOf(locale.value);
      }),
    },
  });
});
