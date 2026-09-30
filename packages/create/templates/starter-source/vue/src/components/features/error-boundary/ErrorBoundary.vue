<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

import { STATUSES } from '../../../config/statuses';
import { ForbiddenError } from '../../../lib/utils/statusUtils';
import StatusPage from '../status-page/StatusPage.vue';

const failed = ref<'forbidden' | 'crashed'>();

// `false` stops the error here: past this point Vue rethrows it in development.
onErrorCaptured((error) => {
  console.error(error);
  failed.value = error instanceof ForbiddenError ? 'forbidden' : 'crashed';

  return false;
});

const retry = (): void => {
  failed.value = undefined;
};
</script>

<!-- Trying again cannot grant access, so the 403 page offers home alone. -->
<template>
  <StatusPage
    v-if="failed === 'forbidden'"
    v-bind="STATUSES.forbidden"
  />
  <StatusPage
    v-else-if="failed === 'crashed'"
    v-bind="STATUSES.serverError"
    :on-retry="retry"
  />
  <slot v-else />
</template>
