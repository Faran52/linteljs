<script setup lang="ts">
import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue';

import { dataProvider } from '@lib/providers/data/dataProvider';
import { fallbackLanguage } from '@i18n/config';

import ContactView from './ContactView.vue';

import type { ContactCopy, ContactCopyKey } from './utils/contactCopyUtils';

interface Props {
  copy: ContactCopy;
}

const props = defineProps<Props>();

// An island is its own Vue app, so it installs the provider its page reads.
getCurrentInstance()?.appContext.app.use(dataProvider);

// The build language until mounted, so hydration matches; then `<html lang>`, which the switcher sets.
const language = ref<string>(fallbackLanguage);

const follow = (): void => {
  language.value = document.documentElement.lang;
};

let observer: MutationObserver | undefined;

onMounted(() => {
  follow();
  observer = new MutationObserver(follow);
  observer.observe(document.documentElement, { attributeFilter: ['lang'] });
});

onBeforeUnmount(() => {
  observer?.disconnect();
});

const translate = (key: ContactCopyKey): string => {
  return props.copy[language.value]?.[key] ?? key;
};
</script>

<template>
  <ContactView :translate="translate" />
</template>
