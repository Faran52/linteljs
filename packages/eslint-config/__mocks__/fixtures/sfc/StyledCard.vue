<script setup lang="ts">
import * as stylex from '@stylexjs/stylex';

const sheet = stylex.create({
  card: { background: 'var(--card)' },
});

const attrs = stylex.attrs(sheet.card);
</script>

<template>
  <div v-bind="attrs">x</div>
</template>
