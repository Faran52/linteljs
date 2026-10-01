<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import CodeText from '../components/ui/code-text/CodeText.vue';
import { CHECK, GATE } from '../config/linteljs';
import { STANDARD_PATHS } from '../config/standard';

const { t } = useI18n();
</script>

<template>
  <main class="page">
    <h1 class="page-title">
      {{ t('about') }}
    </h1>
    <p class="page-lede">
      {{ t('aboutLede') }}
    </p>

    <section class="section">
      <h2 class="section-title">
        {{ t('aboutGate') }}
      </h2>
      <ul class="rows">
        <li
          v-for="leg in GATE"
          :key="leg.command"
          class="row"
        >
          <code class="key">{{ leg.command }}</code>
          <span class="value">{{ leg.runs }}</span>
        </li>
      </ul>
      <p class="note">
        <CodeText :text="t('aboutCheck', { command: CHECK })" />
      </p>
    </section>

    <section class="section">
      <h2 class="section-title">
        {{ t('aboutStandard') }}
      </h2>
      <dl class="rows">
        <div
          v-for="entry in STANDARD_PATHS"
          :key="entry.path"
          class="row"
        >
          <dt><code>{{ entry.path }}</code></dt>
          <dd>{{ t(entry.holds) }}</dd>
        </div>
      </dl>
    </section>

    <section class="section">
      <h2 class="section-title">
        {{ t('aboutCurrent') }}
      </h2>
      <p class="note">
        <CodeText :text="t('aboutSync', { command: 'npx @linteljs/create sync' })" />
      </p>
    </section>
  </main>
</template>
