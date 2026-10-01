<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  import { PAGES } from '@config/routes';

  import {
    applyLanguage,
    detectLanguage,
    m,
  } from '@i18n';

  import LanguageSelect from '../language-select/LanguageSelect.svelte';

  import { styles } from './styles';

  interface Props {
    name: string;
  }

  const { name }: Props = $props();

  // After hydration, so the server's English and the first client render agree.
  onMount(() => {
    applyLanguage(detectLanguage());
  });
</script>

<!-- Real links: SvelteKit routes by URL. -->
<header {...styles.header}>
  <p {...styles.starterLabel}>{m.starterLabel()}</p>
  <p {...styles.brand}>{name}</p>
  <nav {...styles.tabs} aria-label="Main">
    {#each PAGES as entry (entry.id)}
      <a
        {...styles.tab(page.url.pathname === entry.path)}
        href={entry.href}
        aria-current={page.url.pathname === entry.path ? 'page' : undefined}
      >
        {m[entry.id]()}
      </a>
    {/each}
  </nav>
  <LanguageSelect {...styles.tab(false)} />
</header>
