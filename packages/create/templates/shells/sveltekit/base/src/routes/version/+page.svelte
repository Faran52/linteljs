<script lang="ts">
  import { ANSWERS, STACK } from '@config/linteljs';

  import { m } from '@i18n/i18n';

  import CodeText from '@ui/code-text/CodeText.svelte';
</script>

<!-- Recorded when the project was generated: a browser cannot read its machine's Node or package manager. -->
<main class="page">
  <h1 class="page-title">{m.version()}</h1>
  <p class="page-lede">{m.versionLede()}</p>

  <section class="section">
    <h2 class="section-title">{m.versionStack()}</h2>
    <dl class="rows">
      {#each STACK as entry (entry.name)}
        <div class="row">
          <dt>{entry.name}</dt>
          <dd>{entry.version}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section class="section">
    <h2 class="section-title">{m.versionAnswers()}</h2>
    <dl class="rows">
      {#each ANSWERS as entry (entry.label)}
        <div class="row">
          <dt>{m[entry.label]()}</dt>
          <dd>{entry.value}</dd>
        </div>
      {/each}
    </dl>
    <p class="note">
      <CodeText text={m.versionRecorded({ file: 'linteljs.config.json', command: 'sync' })} />
    </p>
  </section>
</main>
