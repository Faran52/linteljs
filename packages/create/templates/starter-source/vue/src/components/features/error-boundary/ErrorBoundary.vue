<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

import { STATUSES } from '../../../config/statuses';
import StatusPage from '../status-page/StatusPage.vue';

const failed = ref(false);

// `false` stops the error here: past this point Vue rethrows it in development.
onErrorCaptured((error) => {
  console.error(error);
  failed.value = true;

  return false;
});

const retry = (): void => {
  failed.value = false;
};
</script>

<template>
  <StatusPage
    v-if="failed"
    v-bind="STATUSES.serverError"
    :on-retry="retry"
  />
  <slot v-else />
</template>
