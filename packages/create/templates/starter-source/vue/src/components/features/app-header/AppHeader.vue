<script setup lang="ts">
import { useRoute } from 'vue-router';

import { ROUTES } from '@views/routes';

import { styles } from './styles';

interface Props {
  name: string;
}

defineProps<Props>();

const route = useRoute();
</script>

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
      <!-- vue-router sets aria-current on the active link itself. -->
      <RouterLink
        v-for="entry in ROUTES"
        :key="entry.id"
        v-bind="styles.tab(entry.path === route.path)"
        :to="entry.path"
      >
        {{ entry.label }}
      </RouterLink>
    </nav>
  </header>
</template>
