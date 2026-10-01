<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AppButton from '../../ui/app-button/AppButton.vue';

interface Props {
  code: number;
  message: string;
  // A prop rather than an emit, so the page knows whether anything listens.
  onRetry?: () => void;
}

defineProps<Props>();

const { t } = useI18n();
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
      {{ t(message) }}
    </p>
    <div class="status-actions">
      <AppButton
        v-if="onRetry"
        @click="onRetry"
      >
        {{ t('statusRetry') }}
      </AppButton>
      <a
        :class="['status-action', { 'status-action-outline': onRetry }]"
        href="/"
      >
        {{ t('statusHome') }}
      </a>
    </div>
  </main>
</template>
