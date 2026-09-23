<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import ExtendedMutationProbe from './ExtendedMutationProbe.svelte';

  interface Props {
    path: string;
    // Taken as a prop where a test spies on it, and made here otherwise, so most cases say nothing about a client.
    client?: QueryClient | undefined;
    invalidates?: readonly string[] | undefined;
  }

  const {
    path,
    client = new QueryClient(),
    invalidates = [],
  }: Props = $props();
</script>

<QueryClientProvider {client}>
  <ExtendedMutationProbe {path} {invalidates} />
</QueryClientProvider>
