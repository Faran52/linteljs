<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ANSWERS, STACK } from '@config/linteljs';

import CodeText from '@ui/code-text/CodeText.vue';

import { styles } from './VersionView.styles';

const { t } = useI18n();
</script>

<template>
  <!-- Recorded when the project was generated: a browser cannot read its machine's Node or package manager. -->
  <main v-bind="styles.page">
    <h1 v-bind="styles.pageTitle">
      {{ t('version') }}
    </h1>
    <p v-bind="styles.pageLede">
      {{ t('versionLede') }}
    </p>

    <section v-bind="styles.section">
      <h2 v-bind="styles.sectionTitle">
        {{ t('versionStack') }}
      </h2>
      <dl v-bind="styles.rows">
        <div
          v-for="entry in STACK"
          :key="entry.name"
          v-bind="styles.row"
        >
          <dt>{{ entry.name }}</dt>
          <dd>{{ entry.version }}</dd>
        </div>
      </dl>
    </section>

    <section v-bind="styles.section">
      <h2 v-bind="styles.sectionTitle">
        {{ t('versionAnswers') }}
      </h2>
      <dl v-bind="styles.rows">
        <div
          v-for="entry in ANSWERS"
          :key="entry.label"
          v-bind="styles.row"
        >
          <dt>{{ t(entry.label) }}</dt>
          <dd>{{ entry.value }}</dd>
        </div>
      </dl>
      <p v-bind="styles.note">
        <CodeText :text="t('versionRecorded', { file: 'linteljs.config.json', command: 'sync' })" />
      </p>
    </section>
  </main>
</template>
