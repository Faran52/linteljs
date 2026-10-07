<script lang="ts">
  import { resolve } from '$app/paths';

  import { m } from '@i18n/i18n';

  import Button from '@ui/button/Button.svelte';

  import type { STATUSES } from '@config/statuses';

  interface Props {
    code: number;
    message: (typeof STATUSES)[keyof typeof STATUSES]['message'];
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
  <p class="status-message" role="alert">{m[message]()}</p>
  <div class="status-actions">
    {#if onretry}
      <Button onclick={onretry}>{m.statusRetry()}</Button>
    {/if}
    <a
      class={actionClasses}
      href={resolve('/')}
      data-sveltekit-reload
    >
      {m.statusHome()}
    </a>
  </div>
</main>
