<script lang="ts">
  import DataProvider from '$lib/providers/data/DataProvider.svelte';

  import type { Component } from 'svelte';

  interface Props {
    page: Component;
  }

  // The data provider is a component in Svelte, so a suite needs a component to put it around its subject.
  const { page: Page }: Props = $props();
</script>

<DataProvider>
  <Page />
</DataProvider>
