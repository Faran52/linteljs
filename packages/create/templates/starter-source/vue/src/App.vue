<script setup lang="ts">
import AppHeader from './components/features/app-header/AppHeader.vue';
import ErrorBoundary from './components/features/error-boundary/ErrorBoundary.vue';
import { NAME } from './config/linteljs';
</script>

<!-- Keyed by path, so leaving a page that crashed clears the fallback. -->
<template>
  <AppHeader :name="NAME" />
  <ErrorBoundary :key="$route.path">
    <RouterView />
  </ErrorBoundary>
</template>
