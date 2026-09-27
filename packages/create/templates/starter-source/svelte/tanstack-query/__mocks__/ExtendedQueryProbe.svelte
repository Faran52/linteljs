<script lang="ts">
  import { untrack } from 'svelte';

  import { createExtendedQuery } from '$lib/hooks/create-extended-query/createExtendedQuery';

  interface Props {
    path: string;
    query?: Record<string, string[]> | undefined;
  }

  interface Answered {
    status: string;
  }

  // A `<script>` runs before its own template, so the hook reading context sits one component down.
  const { path, query }: Props = $props();

  // The probe is handed one path for its lifetime, so reading it once is the intent rather than a missed dependency.
  const result = untrack(() => {
    return createExtendedQuery<Answered>(path, query === undefined ? {} : { query });
  });
</script>

<output data-testid="status">{result.status}</output>
<output data-testid="body">{JSON.stringify(result.data ?? null)}</output>
