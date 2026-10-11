<script setup lang="ts">
import { computed } from 'vue';

import { useI18n } from 'vue-i18n';

import { languages } from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';

const { t, locale } = useI18n();

const language = computed({
  get: () => {
    return locale.value;
  },
  set: chooseLanguage,
});
</script>

<!-- Styled by the header that holds it, so every header keeps one visual language. -->
<template>
  <select
    v-model="language"
    :aria-label="t('language')"
  >
    <option
      v-for="option in languages"
      :key="option.id"
      :value="option.id"
      :lang="option.id"
    >
      {{ option.label }}
    </option>
  </select>
</template>
