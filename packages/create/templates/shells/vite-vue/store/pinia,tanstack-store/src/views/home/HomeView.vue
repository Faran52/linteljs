<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { CHECK, NAME } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import AppButton from '@ui/app-button/AppButton.vue';
import AppMark from '@ui/app-mark/AppMark.vue';
import CodeText from '@ui/code-text/CodeText.vue';

import { styles } from './HomeView.styles';

const { t } = useI18n();
const counter = useCounter();
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

    <div v-bind="styles.counter">
      <span
        v-bind="styles.count"
        aria-live="polite"
      >{{ counter.count }}</span>
      <AppButton @click="counter.add">
        {{ t('homeAdd') }}
      </AppButton>
    </div>
    <p v-bind="styles.caption">
      {{ t('homeCaption') }}
    </p>

    <p v-bind="styles.hint">
      <CodeText :text="t('gateHint', { command: CHECK })" />
    </p>
  </main>
</template>
