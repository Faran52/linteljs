<script setup lang="ts">
import { styles } from './styles';

interface Props {
  // A form's submit is the one that is not a plain button; everything else presses and does something now.
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
