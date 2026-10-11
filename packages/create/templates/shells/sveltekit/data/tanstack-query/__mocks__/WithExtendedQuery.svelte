<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import ExtendedQueryProbe from './ExtendedQueryProbe.svelte';

  interface Props {
    path: string;
    query?: Record<string, string[]> | undefined;
  }

  const { path, query }: Props = $props();

  // Its own client, retries off: a failing query otherwise backs off and the `error` assertion times out.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
</script>

<QueryClientProvider {client}>
  <ExtendedQueryProbe {path} {query} />
</QueryClientProvider>
