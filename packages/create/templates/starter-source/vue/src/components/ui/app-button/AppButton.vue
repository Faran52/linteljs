<script setup lang="ts">
import { styles } from './styles';

interface Props {
  type?: 'button' | 'submit';
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  disabled: false,
});
</script>

<template>
  <button
    v-bind="styles.button"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
