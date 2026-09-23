<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
</script>

<!--
  The slot a data layer fills. With none there is nothing to provide, so this renders what sits under it and
  TanStack Query replaces this file with its own client. It is here rather than inside the layout so that the
  layout does not vary by the data answer.
-->
{@render children()}
