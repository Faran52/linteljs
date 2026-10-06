<script setup lang="ts">
import { computed } from 'vue';

import { styles } from './styles';

import type { TextInputProps } from './types';

interface Emits {
  change: [value: string];
  blur: [];
}

const props = withDefaults(defineProps<TextInputProps>(), {
  multiline: false,
  type: 'text',
});

const emit = defineEmits<Emits>();

const invalid = computed(() => {
  return props.error !== undefined;
});
const describedBy = computed(() => {
  return props.error === undefined ? undefined : `${props.id}-error`;
});

const model = computed({
  get: () => {
    return props.value;
  },
  set: (value: string) => {
    emit('change', value);
  },
});
</script>

<!-- A dense tool pane can get away with `aria-label` alone; a form cannot. -->
<template>
  <div v-bind="styles.field">
    <label
      v-bind="styles.label"
      :for="id"
    >{{ label }}</label>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      v-bind="styles.textarea(invalid)"
      :name="id"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @blur="emit('blur')"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      v-bind="styles.input(invalid)"
      :name="id"
      :type="type"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @blur="emit('blur')"
    >
    <p
      v-if="error !== undefined"
      v-bind="styles.error"
      :id="`${id}-error`"
    >
      {{ error }}
    </p>
  </div>
</template>
