<script lang="ts">
  import type { Component } from 'svelte';

  import DataProvider from '$lib/providers/DataProvider.svelte';

  interface Props {
    page: Component;
  }

  /*
   * The data slot is a component here rather than a plugin or a JSX element, so a suite that needs it around its
   * subject needs a component of its own to put it there. Outside `src/`, so it is not measured and ships as the
   * test helper it is.
   */
  const { page: Page }: Props = $props();
</script>

<DataProvider>
  <Page />
</DataProvider>
