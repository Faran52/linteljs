<script setup lang="ts">
import { ANSWERS, STACK } from '@config/linteljs';
</script>

<template>
  <!-- Recorded when the project was generated: a browser cannot read its machine's Node or package manager. -->
  <main class="page">
    <h1 class="page-title">
      Version
    </h1>
    <p class="page-lede">
      What this project is running, and the answers it was generated from.
    </p>

    <section class="section">
      <h2 class="section-title">
        Stack
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
        Your answers
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
        Recorded in <code>linteljs.config.json</code>, which <code>sync</code> reads.
      </p>
    </section>
  </main>
</template>
