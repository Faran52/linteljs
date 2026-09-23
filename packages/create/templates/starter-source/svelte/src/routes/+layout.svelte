<script lang="ts">
  import { NAME } from '@config/linteljs';

  import AppHeader from '../components/features/app-header/AppHeader.svelte';

  import type { Snippet } from 'svelte';

  import '../app.css';

  import DataProvider from '$lib/providers/DataProvider.svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
</script>

<!-- SvelteKit has no convention that loads a global stylesheet, so the root layout is where the entry is imported. -->
<svelte:head>
  <title>{NAME}</title>
</svelte:head>

<DataProvider>
  <AppHeader name={NAME} />
  {@render children()}
</DataProvider>
