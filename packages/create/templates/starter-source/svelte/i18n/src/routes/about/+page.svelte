<script lang="ts">
  import {
    CHECK,
    GATE,
    SYNC,
  } from '@config/linteljs';
  import { STANDARD_PATHS } from '@config/standard';

  import { m } from '@i18n';

  import CodeText from '@ui/code-text/CodeText.svelte';
</script>

<main class="page">
  <h1 class="page-title">{m.about()}</h1>
  <p class="page-lede">{m.aboutLede()}</p>

  <section class="section">
    <h2 class="section-title">{m.aboutGate()}</h2>
    <ul class="rows">
      {#each GATE as leg (leg.command)}
        <li class="row">
          <code class="key">{leg.command}</code>
          <span class="value">{leg.runs}</span>
        </li>
      {/each}
    </ul>
    <p class="note">
      <CodeText text={m.aboutCheck({ command: CHECK })} />
    </p>
  </section>

  <section class="section">
    <h2 class="section-title">{m.aboutStandard()}</h2>
    <dl class="rows">
      {#each STANDARD_PATHS as entry (entry.path)}
        <div class="row">
          <dt><code>{entry.path}</code></dt>
          <dd>{m[entry.holds]()}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section class="section">
    <h2 class="section-title">{m.aboutCurrent()}</h2>
    <p class="note">
      <CodeText text={m.aboutSync({ command: SYNC })} />
    </p>
  </section>
</main>
