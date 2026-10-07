<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { CHECK, NAME } from '@config/linteljs';

import AppMark from '@ui/app-mark/AppMark.vue';
import CodeText from '@ui/code-text/CodeText.vue';

const { t } = useI18n();
</script>

<template>
  <main class="hero">
    <AppMark />
    <h1 class="title">
      {{ NAME }}
    </h1>
    <p class="lede">
      {{ t('homeLedeNuxt') }}
    </p>
    <p class="hint">
      <CodeText :text="t('gateHint', { command: CHECK })" />
    </p>
  </main>
</template>
