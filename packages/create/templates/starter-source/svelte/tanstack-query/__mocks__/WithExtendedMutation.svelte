<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import ExtendedMutationProbe from './ExtendedMutationProbe.svelte';

  interface Props {
    path: string;
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
