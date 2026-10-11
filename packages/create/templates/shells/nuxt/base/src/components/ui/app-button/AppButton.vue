<script setup lang="ts">
import { styles } from './AppButton.styles';

interface Props {
  type?: 'button' | 'submit';
  disabled?: boolean;
  size?: 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  disabled: false,
  size: 'md',
});
</script>

<template>
  <button
    v-bind="styles[size]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
