<script setup lang="ts">
import AppButton from '../components/ui/app-button/AppButton.vue';
import AppMark from '../components/ui/app-mark/AppMark.vue';
import { NAME } from '../config/linteljs';
import { useCounter } from '../lib/store/counter';

const counter = useCounter();
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

    <div class="counter">
      <span
        class="count"
        aria-live="polite"
      >{{ counter.count }}</span>
      <AppButton @click="counter.add">
        Add one
      </AppButton>
    </div>
    <p class="caption">
      Held in a store, across every page.
    </p>

    <p class="hint">
      Run <code>pnpm check</code> for lint, types, tests and build.
    </p>
  </main>
</template>
