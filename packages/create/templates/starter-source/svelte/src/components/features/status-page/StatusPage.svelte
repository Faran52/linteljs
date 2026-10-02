<script lang="ts">
  import { resolve } from '$app/paths';

  import Button from '@ui/button/Button.svelte';

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

  const actionClasses = $derived(['status-action', onretry && 'status-action-outline']);
</script>

<!-- Home is a full load, so a crash leaves no state behind. -->
<main class="status">
  <h1 class="status-code">{code}</h1>
  <p class="status-message" role="alert">{message}</p>
  <div class="status-actions">
    {#if onretry}
      <Button onclick={onretry}>Try again</Button>
    {/if}
    <a
      class={actionClasses}
      href={resolve('/')}
      data-sveltekit-reload
    >
      Go home
    </a>
  </div>
</main>
