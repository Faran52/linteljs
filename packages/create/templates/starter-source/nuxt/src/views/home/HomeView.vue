<script setup lang="ts">
import { CHECK, NAME } from '@config/linteljs';

import AppMark from '@ui/app-mark/AppMark.vue';
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
      Run <code>{{ CHECK }}</code> for the full gate.
    </p>
  </main>
</template>
