<script lang="ts">
  import { CHECK, NAME } from '@config/linteljs';

  import { m } from '@i18n/i18n';

  import CodeText from '@ui/code-text/CodeText.svelte';
  import Mark from '@ui/mark/Mark.svelte';

  import { styles } from './HomeView.styles';
</script>

<main {...styles.hero}>
  <Mark />
  <h1 {...styles.title}>{NAME}</h1>
  <p {...styles.lede}>{m.homeLedeSvelte()}</p>
  <p {...styles.hint}>
    <CodeText text={m.gateHint({ command: CHECK })} tone="primary" />
  </p>
</main>
