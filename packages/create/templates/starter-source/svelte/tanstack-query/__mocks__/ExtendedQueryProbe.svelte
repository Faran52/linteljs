<script lang="ts">
  import { untrack } from 'svelte';

  import { createExtendedQuery } from '$lib/hooks/create-extended-query/createExtendedQuery';

  interface Props {
    path: string;
    query?: Record<string, string[]> | undefined;
  }

  // What the fake endpoint answers, named because the hook takes it as a type argument.
  interface Answered {
    status: string;
  }

  /*
   * The half that calls the hook, separate from the host that provides the client. A hook reading context has to
   * run inside the provider, and a `<script>` block runs before its own template does: with both in one component
   * the client is not there yet.
   */
  const { path, query }: Props = $props();

  // The probe is handed one path for its lifetime, so reading it once is the intent rather than a missed dependency.
  const result = untrack(() => {
    return createExtendedQuery<Answered>(path, query === undefined ? {} : { query });
  });
</script>

<output data-testid="status">{result.status}</output>
<output data-testid="body">{JSON.stringify(result.data ?? null)}</output>
