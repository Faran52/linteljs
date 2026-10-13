<script setup lang="ts">
import { NAME } from '@config/linteljs';
import { STATUSES } from '@config/statuses';
import { knownStatus } from '@utils/statusUtils';

import type { NuxtError } from 'nuxt/app';

// The status alone: it is all the page reads.
interface Props {
  error: Pick<NuxtError, 'status'>;
}

const props = defineProps<Props>();

const known = computed(() => {
  return knownStatus(props.error.status);
});

// Clearing a crash renders the route again.
const retry = async (): Promise<void> => {
  await clearError();
};
</script>

<!-- Nuxt renders this in place of `app.vue`, so it carries the header itself. -->
<template>
  <AppHeader :name="NAME" />
  <StatusPage
    v-if="known"
    v-bind="known"
  />
  <StatusPage
    v-else
    v-bind="STATUSES.serverError"
    :on-retry="retry"
  />
</template>
