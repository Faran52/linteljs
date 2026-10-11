<script lang="ts">
  import {
    CHECK,
    GATE,
    SYNC,
  } from '@config/linteljs';
  import { STANDARD_PATHS } from '@config/standard';

  import { m } from '@i18n/i18n';

  import CodeText from '@ui/code-text/CodeText.svelte';

  import { styles } from './AboutView.styles';
</script>

<main {...styles.page}>
  <h1 {...styles.pageTitle}>{m.about()}</h1>
  <p {...styles.pageLede}>{m.aboutLede()}</p>

  <section {...styles.section}>
    <h2 {...styles.sectionTitle}>{m.aboutGate()}</h2>
    <ul {...styles.rows}>
      {#each GATE as leg (leg.command)}
        <li {...styles.row}>
          <code {...styles.keyCode}>{leg.command}</code>
          <span {...styles.value}>{leg.runs}</span>
        </li>
      {/each}
    </ul>
    <p {...styles.note}>
      <CodeText text={m.aboutCheck({ command: CHECK })} tone="primary" />
    </p>
  </section>

  <section {...styles.section}>
    <h2 {...styles.sectionTitle}>{m.aboutStandard()}</h2>
    <dl {...styles.rows}>
      {#each STANDARD_PATHS as entry (entry.path)}
        <div {...styles.row}>
          <dt {...styles.key}><code>{entry.path}</code></dt>
          <dd {...styles.value}>{m[entry.holds]()}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section {...styles.section}>
    <h2 {...styles.sectionTitle}>{m.aboutCurrent()}</h2>
    <p {...styles.note}>
      <CodeText text={m.aboutSync({ command: SYNC })} tone="primary" />
    </p>
  </section>
</main>
