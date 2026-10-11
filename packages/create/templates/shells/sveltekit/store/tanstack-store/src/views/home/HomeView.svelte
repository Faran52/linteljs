<script lang="ts">
  import { useCounter } from '#lib/store/counter/counterStore.ts';

  import { CHECK, NAME } from '@config/linteljs';

  import { m } from '@i18n/i18n';

  import Button from '@ui/button/Button.svelte';
  import CodeText from '@ui/code-text/CodeText.svelte';
  import Mark from '@ui/mark/Mark.svelte';

  import { styles } from './HomeView.styles';

  const counter = useCounter();
</script>

<main {...styles.hero}>
  <Mark />
  <h1 {...styles.title}>{NAME}</h1>
  <p {...styles.lede}>{m.homeLedeSvelte()}</p>

  <div {...styles.counter}>
    <span {...styles.count} aria-live="polite">{counter.count}</span>
    <Button onclick={counter.add}>{m.homeAdd()}</Button>
  </div>
  <p {...styles.caption}>{m.homeCaption()}</p>

  <p {...styles.hint}>
    <CodeText text={m.gateHint({ command: CHECK })} tone="primary" />
  </p>
</main>
