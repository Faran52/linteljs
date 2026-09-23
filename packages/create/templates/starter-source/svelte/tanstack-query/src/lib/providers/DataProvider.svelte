<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();

  // One client for the application, made once rather than per render.
  const client = new QueryClient();
</script>

<QueryClientProvider {client}>
  {@render children()}
</QueryClientProvider>
