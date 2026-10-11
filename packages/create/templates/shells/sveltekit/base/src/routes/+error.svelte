<script lang="ts">
  import { refreshAll } from '$app/navigation';
  import { page } from '$app/state';

  import { STATUSES } from '@config/statuses';

  import StatusPage from '@features/status-page/StatusPage.svelte';

  // Any other status is a crash, and invalidating runs what failed again.
  const knownStatuses = [STATUSES.forbidden, STATUSES.notFound];
  const known = $derived(knownStatuses
    .find(({ code }) => {
      return code === page.status;
    }));
</script>

{#if known}
  <StatusPage {...known} />
{:else}
  <StatusPage {...STATUSES.serverError} onretry={refreshAll} />
{/if}
