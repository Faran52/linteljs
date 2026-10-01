<script lang="ts">
  import { page } from '$app/state';

  import { PAGES } from '@config/routes';

  import { styles } from './styles';

  interface Props {
    name: string;
  }

  const { name }: Props = $props();
</script>

<!-- Real links: SvelteKit routes by URL. -->
<header {...styles.header}>
  <p {...styles.starterLabel}>LintelJS Starter</p>
  <p {...styles.brand}>{name}</p>
  <nav {...styles.tabs} aria-label="Main">
    {#each PAGES as entry (entry.id)}
      <a
        {...styles.tab(page.url.pathname === entry.path)}
        href={entry.href}
        aria-current={page.url.pathname === entry.path ? 'page' : undefined}
      >
        {entry.label}
      </a>
    {/each}
  </nav>
</header>
