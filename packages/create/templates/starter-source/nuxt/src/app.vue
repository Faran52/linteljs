<script setup lang="ts">
import AppHeader from './components/features/app-header/AppHeader.vue';
import { NAME } from './config/linteljs';
</script>

<!--
  The shell Nuxt wraps every route in. `NuxtPage` is where the file under `pages/` renders, and the header sits
  outside it so it is mounted once rather than per route. Both are Nuxt's own global components, which is why
  neither is imported.
-->
<template>
  <AppHeader :name="NAME" />
  <NuxtPage />
</template>
