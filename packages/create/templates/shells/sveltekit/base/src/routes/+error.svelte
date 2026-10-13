<script lang="ts">
  import { refreshAll } from '$app/navigation';
  import { page } from '$app/state';

  import { STATUSES } from '@config/statuses';
  import { knownStatus } from '@utils/statusUtils';

  import StatusPage from '@features/status-page/StatusPage.svelte';

  // Invalidating a crash runs what failed again.
  const known = $derived(knownStatus(page.status));
</script>

{#if known}
  <StatusPage {...known} />
{:else}
  <StatusPage {...STATUSES.serverError} onretry={refreshAll} />
{/if}
