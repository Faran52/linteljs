<script setup lang="ts">
import { useRoute } from 'vue-router';

import { useI18n } from 'vue-i18n';

import { ROUTES } from '@views/routes';

import LanguageSelect from '../language-select/LanguageSelect.vue';

import { styles } from './appHeaderStyles';

interface Props {
  name: string;
}

defineProps<Props>();

const route = useRoute();
const { t } = useI18n();
</script>

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
      <!-- vue-router sets aria-current on the active link itself. -->
      <RouterLink
        v-for="entry in ROUTES"
        :key="entry.id"
        v-bind="styles.tab(entry.path === route.path)"
        :to="entry.path"
      >
        {{ t(entry.id) }}
      </RouterLink>
    </nav>
    <LanguageSelect v-bind="styles.tab(false)" />
  </header>
</template>
