<script setup lang="ts">
import { NAME } from '@config/linteljs';
</script>

<!-- `NuxtPage` is a Nuxt global component, so it needs no import. -->
<template>
  <AppHeader :name="NAME" />
  <NuxtPage />
</template>
