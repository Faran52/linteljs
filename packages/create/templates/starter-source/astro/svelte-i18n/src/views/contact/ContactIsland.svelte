<script lang="ts">
  import { onMount } from 'svelte';
  import DataProvider from '#lib/providers/data/DataProvider.svelte';

  import { fallbackLanguage } from '@i18n/config';

  import ContactPage from './ContactPage.svelte';

  import type { ContactCopy, ContactCopyKey } from './utils/contactCopyUtils';

  interface Props {
    copy: ContactCopy;
  }

  const { copy }: Props = $props();

  // The build language until mounted, so hydration matches; then `<html lang>`, which the switcher sets.
  let language = $state<string>(fallbackLanguage);

  onMount(() => {
    const follow = (): void => {
      language = document.documentElement.lang;
    };

    const observer = new MutationObserver(follow);

    follow();

    observer.observe(document.documentElement, { attributeFilter: ['lang'] });

    return () => {
      observer.disconnect();
    };
  });

  const phrase = (key: ContactCopyKey): string => {
    return copy[language]?.[key] ?? key;
  };
</script>

<!-- An island is its own Svelte root, so it brings its provider. -->
<DataProvider>
  <ContactPage {phrase} />
</DataProvider>
