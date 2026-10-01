<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';

  import { STATUSES } from '@config/statuses';

  import StatusPage from '@features/status-page/StatusPage.svelte';

  // Any other status is a crash, and invalidating runs what failed again.
  const known = $derived([STATUSES.forbidden, STATUSES.notFound]
    .find(({ code }) => {
      return code === page.status;
    }));
</script>

{#if known}
  <StatusPage {...known} />
{:else}
  <StatusPage {...STATUSES.serverError} onretry={invalidateAll} />
{/if}
