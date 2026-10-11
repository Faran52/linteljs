<script lang="ts">
  import { styles } from './Button.styles';

  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    onclick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    size?: keyof typeof styles;
  }

  const {
    children,
    onclick,
    type = 'button',
    disabled = false,
    size = 'md',
  }: Props = $props();
</script>

<button {...styles[size]} {type} {disabled} {onclick}>
  {@render children()}
</button>
