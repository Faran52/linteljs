<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import {
  CHECK,
  GATE,
  SYNC,
} from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import CodeText from '@ui/code-text/CodeText.vue';

import { styles } from './AboutView.styles';

const { t } = useI18n();
</script>

<template>
  <main v-bind="styles.page">
    <h1 v-bind="styles.pageTitle">
      {{ t('about') }}
    </h1>
    <p v-bind="styles.pageLede">
      {{ t('aboutLede') }}
    </p>

    <section v-bind="styles.section">
      <h2 v-bind="styles.sectionTitle">
        {{ t('aboutGate') }}
      </h2>
      <ul v-bind="styles.rows">
        <li
          v-for="leg in GATE"
          :key="leg.command"
          v-bind="styles.row"
        >
          <code v-bind="styles.keyCode">{{ leg.command }}</code>
          <span v-bind="styles.value">{{ leg.runs }}</span>
        </li>
      </ul>
      <p v-bind="styles.note">
        <CodeText
          :text="t('aboutCheck', { command: CHECK })"
          tone="primary"
        />
      </p>
    </section>

    <section v-bind="styles.section">
      <h2 v-bind="styles.sectionTitle">
        {{ t('aboutStandard') }}
      </h2>
      <dl v-bind="styles.rows">
        <div
          v-for="entry in STANDARD_PATHS"
          :key="entry.path"
          v-bind="styles.row"
        >
          <dt v-bind="styles.key"><code>{{ entry.path }}</code></dt>
          <dd v-bind="styles.value">{{ t(entry.holds) }}</dd>
        </div>
      </dl>
    </section>

    <section v-bind="styles.section">
      <h2 v-bind="styles.sectionTitle">
        {{ t('aboutCurrent') }}
      </h2>
      <p v-bind="styles.note">
        <CodeText
          :text="t('aboutSync', { command: SYNC })"
          tone="primary"
        />
      </p>
    </section>
  </main>
</template>
