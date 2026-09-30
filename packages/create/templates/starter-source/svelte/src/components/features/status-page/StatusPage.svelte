<script lang="ts">
  import { resolve } from '$app/paths';

  import Button from '../../ui/button/Button.svelte';

  interface Props {
    code: number;
    message: string;
    onretry?: () => void;
  }

  const {
    code,
    message,
    onretry,
  }: Props = $props();
</script>

<!-- Home is a full load, so a crash leaves no state behind. -->
<main class="hero">
  <h1 class="title">{code}</h1>
  <p class="lede" role="alert">{message}</p>
  <p class="hint">
    {#if onretry}
      <Button onclick={onretry}>Try again</Button>
    {/if}
    <a href={resolve('/')} data-sveltekit-reload>Go home</a>
  </p>
</main>
