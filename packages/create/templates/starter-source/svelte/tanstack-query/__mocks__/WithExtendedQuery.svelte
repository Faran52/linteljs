<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import ExtendedQueryProbe from './ExtendedQueryProbe.svelte';

  interface Props {
    path: string;
    query?: Record<string, string[]> | undefined;
  }

  // The provider, with the hook one component down so it runs inside the context rather than beside it.
  const { path, query }: Props = $props();

  /*
   * Its own client rather than `DataProvider`'s, for the one default that matters here: retries off. A failing
   * query otherwise backs off three times and the assertion on `error` times out while the status reads
   * `pending`. Mutations need no such client, TanStack Query not retrying those to begin with.
   */
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
</script>

<QueryClientProvider {client}>
  <ExtendedQueryProbe {path} {query} />
</QueryClientProvider>
