<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
</script>

<!-- Here rather than in the layout, so the layout does not vary by the data answer. -->
{@render children()}
