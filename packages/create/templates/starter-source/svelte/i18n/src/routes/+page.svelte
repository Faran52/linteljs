<script lang="ts">
  import { CHECK, NAME } from '@config/linteljs';

  import { m } from '@i18n';

  import CodeText from '@ui/code-text/CodeText.svelte';
  import Mark from '@ui/mark/Mark.svelte';
</script>

<main class="hero">
  <Mark />
  <h1 class="title">{NAME}</h1>
  <p class="lede">{m.homeLedeSvelte()}</p>
  <p class="hint">
    <CodeText text={m.gateHint({ command: CHECK })} />
  </p>
</main>
