<script lang="ts">
  import { useCounter } from '#lib/store/counter/counterStore.ts';

  import { CHECK, NAME } from '@config/linteljs';

  import { m } from '@i18n/i18n';

  import Button from '@ui/button/Button.svelte';
  import CodeText from '@ui/code-text/CodeText.svelte';
  import Mark from '@ui/mark/Mark.svelte';

  const counter = useCounter();
</script>

<main class="hero">
  <Mark />
  <h1 class="title">{NAME}</h1>
  <p class="lede">{m.homeLedeSvelte()}</p>

  <div class="counter">
    <span class="count" aria-live="polite">{counter.count}</span>
    <Button onclick={counter.add}>{m.homeAdd()}</Button>
  </div>
  <p class="caption">{m.homeCaption()}</p>

  <p class="hint">
    <CodeText text={m.gateHint({ command: CHECK })} />
  </p>
</main>
