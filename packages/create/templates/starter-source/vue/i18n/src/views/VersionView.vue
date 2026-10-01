<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import CodeText from '../components/ui/code-text/CodeText.vue';
import { ANSWERS, STACK } from '../config/linteljs';

const { t } = useI18n();
</script>

<template>
  <!-- What was recorded at birth: a browser cannot read its machine's Node or package manager. -->
  <main class="page">
    <h1 class="page-title">
      {{ t('version') }}
    </h1>
    <p class="page-lede">
      {{ t('versionLede') }}
    </p>

    <section class="section">
      <h2 class="section-title">
        {{ t('versionStack') }}
      </h2>
      <dl class="rows">
        <div
          v-for="entry in STACK"
          :key="entry.name"
          class="row"
        >
          <dt>{{ entry.name }}</dt>
          <dd>{{ entry.version }}</dd>
        </div>
      </dl>
    </section>

    <section class="section">
      <h2 class="section-title">
        {{ t('versionAnswers') }}
      </h2>
      <dl class="rows">
        <div
          v-for="entry in ANSWERS"
          :key="entry.label"
          class="row"
        >
          <dt>{{ entry.label }}</dt>
          <dd>{{ entry.value }}</dd>
        </div>
      </dl>
      <p class="note">
        <CodeText :text="t('versionRecorded', { file: 'linteljs.config.json', command: 'sync' })" />
      </p>
    </section>
  </main>
</template>
