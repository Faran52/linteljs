<script setup lang="ts">
import { computed } from 'vue';
import { clearError, type NuxtError } from 'nuxt/app';

import { NAME } from '@config/linteljs';
import { STATUSES } from '@config/statuses';

import AppHeader from './components/features/app-header/AppHeader.vue';
import StatusPage from './components/features/status-page/StatusPage.vue';

// The status alone: it is all the page reads.
interface Props {
  error: Pick<NuxtError, 'status'>;
}

const props = defineProps<Props>();

// Any other status is a crash, and clearing it renders the route again.
const knownStatuses = [STATUSES.forbidden, STATUSES.notFound];
const known = computed(() => {
  return knownStatuses
    .find(({ code }) => {
      return code === props.error.status;
    });
});

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
