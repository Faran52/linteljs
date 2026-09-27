<script lang="ts">
  import type { Component } from 'svelte';

  import DataProvider from '$lib/providers/DataProvider.svelte';

  interface Props {
    page: Component;
  }

  // The data slot is a component here, so a suite needs a component to put it around its subject.
  const { page: Page }: Props = $props();
</script>

<DataProvider>
  <Page />
</DataProvider>
