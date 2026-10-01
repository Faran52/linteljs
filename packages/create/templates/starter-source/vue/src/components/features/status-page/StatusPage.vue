<script setup lang="ts">
import AppButton from '@ui/app-button/AppButton.vue';

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
  <main class="status">
    <h1 class="status-code">
      {{ code }}
    </h1>
    <p
      class="status-message"
      role="alert"
    >
      {{ message }}
    </p>
    <div class="status-actions">
      <AppButton
        v-if="onRetry"
        @click="onRetry"
      >
        Try again
      </AppButton>
      <a
        :class="['status-action', { 'status-action-outline': onRetry }]"
        href="/"
      >
        Go home
      </a>
    </div>
  </main>
</template>
