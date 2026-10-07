<script lang="ts">
  import DataProvider from '#lib/providers/data/DataProvider.svelte';

  import ContactFormProbe from './ContactFormProbe.svelte';

  import type { ComponentProps } from 'svelte';

  const { translate, capture }: ComponentProps<typeof ContactFormProbe> = $props();
</script>

<DataProvider>
  <ContactFormProbe {translate} {capture} />
</DataProvider>
