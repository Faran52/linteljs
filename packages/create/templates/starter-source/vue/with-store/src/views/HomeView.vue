<script setup lang="ts">
import { CHECK, NAME } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import AppButton from '@ui/app-button/AppButton.vue';
import AppMark from '@ui/app-mark/AppMark.vue';

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
      Run <code>{{ CHECK }}</code> for the full gate.
    </p>
  </main>
</template>
