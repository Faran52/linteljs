<script setup lang="ts">
import { computed } from 'vue';

import { styles } from './styles';

import type { TextInputProps } from './types';

// The tuple form of an emit declaration, named so it is a shape the file can refer to rather than an inline one.
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

/*
 * Vue hands a native `@input` a bare `Event`, whose `target` is an `EventTarget`, so the value needs narrowing to
 * be read at all. `v-model` would avoid it and cannot be used here: Vue refuses one on an input whose `type` is
 * bound. The else has no case: this handler is bound to an input and a textarea and to nothing else.
 */
const onInput = (event: Event): void => {
  const field = event.target;

  /* v8 ignore next 3 */
  if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
    return;
  }

  emit('change', field.value);
};
</script>

<!--
  The label is visible and bound with `for`, and the error is wired with `aria-describedby`. A dense tool pane can
  get away with `aria-label` alone; a form cannot.
-->
<template>
  <div v-bind="styles.field">
    <label
      v-bind="styles.label"
      :for="id"
    >{{ label }}</label>
    <textarea
      v-if="multiline"
      :id="id"
      v-bind="styles.textarea(invalid)"
      :name="id"
      :value="value"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @input="onInput"
      @blur="emit('blur')"
    />
    <input
      v-else
      :id="id"
      v-bind="styles.input(invalid)"
      :name="id"
      :type="type"
      :value="value"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @input="onInput"
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
