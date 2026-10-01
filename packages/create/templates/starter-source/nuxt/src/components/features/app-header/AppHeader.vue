<script setup lang="ts">
import { useRoute } from 'vue-router';

import { PAGES } from '@config/routes';

import { styles } from './styles';

interface Props {
  name: string;
}

defineProps<Props>();

// Imported, not auto-imported: vitest runs outside Nuxt's build and has no auto-import to resolve.
const route = useRoute();
</script>

<!-- `NuxtLink` prefetches a route and keeps the address bar honest. -->
<template>
  <header v-bind="styles.header">
    <p v-bind="styles.starterLabel">
      LintelJS Starter
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
        {{ page.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
