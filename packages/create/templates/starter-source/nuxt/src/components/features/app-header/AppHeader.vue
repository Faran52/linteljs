<script setup lang="ts">
import { useRoute } from 'vue-router';

import { PAGES } from '../../../config/routes';

interface Props {
  name: string;
}

defineProps<Props>();

/*
 * `useRoute` is imported rather than taken from Nuxt's auto-imports, so this component is the same under vitest,
 * which runs outside Nuxt's build and has no auto-import to resolve. It is vue-router's either way.
 */
const route = useRoute();
</script>

<!-- The tabs are `NuxtLink`, which is what prefetches a route and keeps the address bar honest. -->
<template>
  <header class="header">
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
