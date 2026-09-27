<script setup lang="ts">
import AppHeader from './components/features/app-header/AppHeader.vue';
import { NAME } from './config/linteljs';
</script>

<!-- `NuxtPage` and the header are Nuxt's global components, which is why neither is imported. -->
<template>
  <AppHeader :name="NAME" />
  <NuxtPage />
</template>
