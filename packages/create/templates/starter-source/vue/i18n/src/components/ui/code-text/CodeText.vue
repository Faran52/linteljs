<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text: string;
}

const props = defineProps<Props>();

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
const parts = computed(() => {
  return props.text.split(/<\/?code>/u);
});
</script>

<template>
  <span>
    <template
      v-for="(part, index) in parts"
      :key="index"
    >
      <code v-if="index % 2 === 1">{{ part }}</code>
      <template v-else>
        {{ part }}
      </template>
    </template>
  </span>
</template>
