<script setup lang="ts">
import AppMark from '../components/ui/app-mark/AppMark.vue';
import { CHECK, NAME } from '../config/linteljs';
</script>

<template>
  <main class="hero">
    <AppMark />
    <h1 class="title">
      {{ NAME }}
    </h1>
    <p class="lede">
      Vue, Vite and the standard already applied.
    </p>
    <p class="hint">
      Run <code>{{ CHECK }}</code> for the full gate.
    </p>
  </main>
</template>
