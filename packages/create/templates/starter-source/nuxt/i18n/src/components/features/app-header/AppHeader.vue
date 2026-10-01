<script setup lang="ts">
import { useRoute } from 'vue-router';

import { useI18n } from 'vue-i18n';

import { PAGES } from '../../../config/routes';
import LanguageSelect from '../language-select/LanguageSelect.vue';

import { styles } from './styles';

interface Props {
  name: string;
}

defineProps<Props>();

// Imported, not auto-imported: vitest runs outside Nuxt's build and has no auto-import to resolve.
const route = useRoute();
const { t } = useI18n();
</script>

<!-- `NuxtLink` prefetches a route and keeps the address bar honest. -->
<template>
  <header v-bind="styles.header">
    <p v-bind="styles.starterLabel">
      {{ t('starterLabel') }}
    </p>
    <p v-bind="styles.brand">
      {{ name }}
    </p>
    <nav
      v-bind="styles.tabs"
      aria-label="Main"
    >
      <NuxtLink
        v-for="page in PAGES"
        :key="page.id"
        v-bind="styles.tab(route.path === page.path)"
        :to="page.path"
        :aria-current="route.path === page.path ? 'page' : undefined"
      >
        {{ t(page.id) }}
      </NuxtLink>
    </nav>
    <LanguageSelect v-bind="styles.tab(false)" />
  </header>
</template>
