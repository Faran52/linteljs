<script lang="ts">
  import { styles } from './styles';

  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    onclick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
  }

  const {
    children,
    onclick,
    type = 'button',
    disabled = false,
  }: Props = $props();
</script>

<button {...styles.button} {type} {disabled} {onclick}>
  {@render children()}
</button>
