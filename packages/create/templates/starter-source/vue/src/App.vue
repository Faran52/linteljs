<script setup lang="ts">
import AppHeader from './components/features/app-header/AppHeader.vue';
import { NAME } from './config/linteljs';
</script>

<template>
  <AppHeader :name="NAME" />
  <RouterView />
</template>
