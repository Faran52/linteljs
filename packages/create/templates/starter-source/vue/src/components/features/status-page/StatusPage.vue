<script setup lang="ts">
import AppButton from '../../ui/app-button/AppButton.vue';

interface Props {
  code: number;
  message: string;
  // A prop rather than an emit, so the page knows whether anything listens.
  onRetry?: () => void;
}

defineProps<Props>();
</script>

<!-- Home is a full load, so a crash leaves no state behind. -->
<template>
  <main class="hero">
    <h1 class="title">
      {{ code }}
    </h1>
    <p
      class="lede"
      role="alert"
    >
      {{ message }}
    </p>
    <p class="hint">
      <AppButton
        v-if="onRetry"
        @click="onRetry"
      >
        Try again
      </AppButton>
      {{ ' ' }}
      <a href="/">Go home</a>
    </p>
  </main>
</template>
