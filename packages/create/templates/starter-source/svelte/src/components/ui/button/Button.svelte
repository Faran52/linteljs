<script lang="ts">
  import { styles } from './styles';

  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    onclick?: () => void;
    // A form's submit is the one that is not a plain button; everything else presses and does something now.
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
