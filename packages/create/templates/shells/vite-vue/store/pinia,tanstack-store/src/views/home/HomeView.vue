<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { CHECK, NAME } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import AppButton from '@ui/app-button/AppButton.vue';
import AppMark from '@ui/app-mark/AppMark.vue';
import CodeText from '@ui/code-text/CodeText.vue';

const { t } = useI18n();
const counter = useCounter();
</script>

<template>
  <main class="hero">
    <AppMark />
    <h1 class="title">
      {{ NAME }}
    </h1>
    <p class="lede">
      {{ t('homeLedeVue') }}
    </p>

    <div class="counter">
      <span
        class="count"
        aria-live="polite"
      >{{ counter.count }}</span>
      <AppButton @click="counter.add">
        {{ t('homeAdd') }}
      </AppButton>
    </div>
    <p class="caption">
      {{ t('homeCaption') }}
    </p>

    <p class="hint">
      <CodeText :text="t('gateHint', { command: CHECK })" />
    </p>
  </main>
</template>
