<script setup lang="ts">
import AppMark from '../components/ui/app-mark/AppMark.vue';
import { NAME } from '../config/linteljs';
</script>

<template>
  <main class="hero">
    <AppMark />
    <h1 class="title">
      {{ NAME }}
    </h1>
    <p class="lede">
      Nuxt, Vue and the standard already applied.
    </p>
    <p class="hint">
      Run <code>pnpm check</code> for lint, types, tests and build.
    </p>
  </main>
</template>
