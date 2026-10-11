<script lang="ts">
  import { ANSWERS, STACK } from '@config/linteljs';

  import { m } from '@i18n/i18n';

  import CodeText from '@ui/code-text/CodeText.svelte';

  import { styles } from './VersionView.styles';
</script>

<!-- Recorded when the project was generated: a browser cannot read its machine's Node or package manager. -->
<main {...styles.page}>
  <h1 {...styles.pageTitle}>{m.version()}</h1>
  <p {...styles.pageLede}>{m.versionLede()}</p>

  <section {...styles.section}>
    <h2 {...styles.sectionTitle}>{m.versionStack()}</h2>
    <dl {...styles.rows}>
      {#each STACK as entry (entry.name)}
        <div {...styles.row}>
          <dt>{entry.name}</dt>
          <dd>{entry.version}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section {...styles.section}>
    <h2 {...styles.sectionTitle}>{m.versionAnswers()}</h2>
    <dl {...styles.rows}>
      {#each ANSWERS as entry (entry.label)}
        <div {...styles.row}>
          <dt>{m[entry.label]()}</dt>
          <dd>{entry.value}</dd>
        </div>
      {/each}
    </dl>
    <p {...styles.note}>
      <CodeText text={m.versionRecorded({ file: 'linteljs.config.json', command: 'sync' })} />
    </p>
  </section>
</main>
