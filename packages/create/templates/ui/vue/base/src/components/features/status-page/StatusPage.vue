<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AppButton from '@ui/app-button/AppButton.vue';

import { styles } from './StatusPage.styles';

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
  <main v-bind="styles.status">
    <h1 v-bind="styles.statusCode">
      {{ code }}
    </h1>
    <p
      v-bind="styles.statusMessage"
      role="alert"
    >
      {{ t(message) }}
    </p>
    <div v-bind="styles.statusActions">
      <AppButton
        v-if="onRetry"
        @click="onRetry"
      >
        {{ t('statusRetry') }}
      </AppButton>
      <a
        v-bind="styles.action(onRetry !== undefined)"
        href="/"
      >
        {{ t('statusHome') }}
      </a>
    </div>
  </main>
</template>
