<script setup lang="ts">
import { useRoute } from 'vue-router';

import { ROUTES } from '../../../views/routes';

import { styles } from './styles';

interface Props {
  name: string;
}

defineProps<Props>();

// Read here rather than left to `active-class`, which appends: under StyleX the current tab is a different set of
// atomic classes, not the base set plus one, so which tab is current has to be a value the styles are asked for.
const route = useRoute();
</script>

<template>
  <header v-bind="styles.header">
    <p v-bind="styles.brand">
      {{ name }}
    </p>
    <nav
      v-bind="styles.tabs"
      aria-label="Main"
    >
      <!-- Real links, because this target routes: vue-router sets aria-current on the active one itself. -->
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
