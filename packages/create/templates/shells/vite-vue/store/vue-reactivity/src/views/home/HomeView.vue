<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { CHECK, NAME } from '@config/linteljs';

import AppMark from '@ui/app-mark/AppMark.vue';
import CodeText from '@ui/code-text/CodeText.vue';

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
      {{ t('homeLedeVue') }}
    </p>
    <p v-bind="styles.hint">
      <CodeText
        :text="t('gateHint', { command: CHECK })"
        tone="primary"
      />
    </p>
  </main>
</template>
