<script setup lang="ts">
import { styles } from './styles';
</script>

<template>
  <svg
    v-bind="styles.mark"
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    role="img"
    aria-label="linteljs"
  >
    <path
      d="M12 28.5 H108"
      stroke-width="13"
    />
    <path
      v-bind="styles.line1"
      d="M12 51.5 H86"
      stroke-width="9"
    />
    <path
      v-bind="styles.line2"
      d="M12 72.5 H104"
      stroke-width="9"
    />
    <path
      v-bind="styles.line3"
      d="M12 93.5 H68"
      stroke-width="9"
    />
  </svg>
</template>
