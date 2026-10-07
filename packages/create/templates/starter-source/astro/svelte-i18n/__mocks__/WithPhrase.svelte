<script lang="ts">
  import DataProvider from '#lib/providers/data/DataProvider.svelte';

  import ContactPage from '@views/contact/ContactPage.svelte';

  import type { ContactCopyKey } from '@views/contact/utils/contactCopyUtils';

  interface Props {
    phrase: (key: ContactCopyKey) => string;
  }

  // The page takes its words, which Svelte's own `WithData` cannot hand it.
  const { phrase }: Props = $props();
</script>

<DataProvider>
  <ContactPage {phrase} />
</DataProvider>
