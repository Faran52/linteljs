<script setup lang="ts">
import { useRoute } from 'vue-router';

import { PAGES } from '../../../config/routes';

interface Props {
  name: string;
}

defineProps<Props>();

// Imported, not auto-imported: vitest runs outside Nuxt's build and has no auto-import to resolve.
const route = useRoute();
</script>

<!-- `NuxtLink` prefetches a route and keeps the address bar honest. -->
<template>
  <header class="header">
    <p class="starter-label">
      LintelJS Starter
    </p>
    <p class="brand">
      {{ name }}
    </p>
    <nav
      class="tabs"
      aria-label="Main"
    >
      <NuxtLink
        v-for="page in PAGES"
        :key="page.id"
        class="tab"
        :to="page.path"
        :aria-current="route.path === page.path ? 'page' : undefined"
      >
        {{ page.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
