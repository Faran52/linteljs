<script setup lang="ts">
import { NAME } from '@config/linteljs';

import AppHeader from './components/features/app-header/AppHeader.vue';
</script>

<!-- `NuxtPage` and the header are Nuxt's global components, which is why neither is imported. -->
<template>
  <AppHeader :name="NAME" />
  <NuxtPage />
</template>
