<script lang="ts">
  import { resolve } from '$app/paths';

  import { m } from '@i18n/i18n';

  import Button from '@ui/button/Button.svelte';

  import { styles } from './StatusPage.styles';

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
</script>

<!-- Home is a full load, so a crash leaves no state behind. -->
<main {...styles.status}>
  <h1 {...styles.statusCode}>{code}</h1>
  <p {...styles.statusMessage} role="alert">{m[message]()}</p>
  <div {...styles.statusActions}>
    {#if onretry}
      <Button onclick={onretry} size="lg">{m.statusRetry()}</Button>
    {/if}
    <a
      {...styles.action(onretry !== undefined)}
      href={resolve('/')}
      data-sveltekit-reload
    >
      {m.statusHome()}
    </a>
  </div>
</main>
