<script setup lang="ts">
import { computed } from 'vue';

import { styles } from './CodeText.styles';

interface Props {
  text: string;
  tone?: 'primary';
}

const props = defineProps<Props>();

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
const parts = computed(() => {
  return props.text.split(/<\/?code>/u);
});

const toneStyle = computed(() => {
  return props.tone === undefined ? undefined : styles[props.tone];
});
</script>

<template>
  <span>
    <template
      v-for="(part, index) in parts"
      :key="index"
    >
      <code
        v-if="index % 2 === 1"
        v-bind="toneStyle"
      >{{ part }}</code>
      <template v-else>
        {{ part }}
      </template>
    </template>
  </span>
</template>
