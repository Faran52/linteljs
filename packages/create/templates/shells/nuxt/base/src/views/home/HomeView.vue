<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { CHECK, NAME } from '@config/linteljs';

import { styles } from './HomeView.styles';

const { t } = useI18n();
</script>

<template>
  <main v-bind="styles.hero">
    <AppMark />
    <h1 v-bind="styles.title">
      {{ NAME }}
    </h1>
    <p v-bind="styles.lede">
      {{ t('homeLedeNuxt') }}
    </p>
    <p v-bind="styles.hint">
      <CodeText :text="t('gateHint', { command: CHECK })" />
    </p>
  </main>
</template>
