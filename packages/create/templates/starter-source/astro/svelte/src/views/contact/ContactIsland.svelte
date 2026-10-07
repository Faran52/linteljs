<script lang="ts">
  import DataProvider from '#lib/providers/data/DataProvider.svelte';

  import ContactPage from './ContactPage.svelte';
</script>

<!-- An island is its own Svelte root, so it brings its provider. -->
<DataProvider>
  <ContactPage />
</DataProvider>
