import { For, type JSX } from 'solid-js';

import { ANSWERS, STACK } from '../../config/linteljs';

/*
 * What was recorded at birth, rather than what is resolved now. A browser cannot read its machine's Node or
 * package manager, and `package.json` carries ranges rather than versions.
 */
export const VersionPage = (): JSX.Element => {
  return (
    <main class="page">
      <h1 class="page-title">Version</h1>
      <p class="page-lede">What this project is running, and the answers it was generated from.</p>

      <section class="section">
        <h2 class="section-title">Stack</h2>
        <dl class="rows">
          <For each={STACK}>
            {(entry) => {
              return (
                <div class="row">
                  <dt>{entry.name}</dt>
                  <dd>{entry.version}</dd>
                </div>
              );
            }}
          </For>
        </dl>
      </section>

      <section class="section">
        <h2 class="section-title">Your answers</h2>
        <dl class="rows">
          <For each={ANSWERS}>
            {(entry) => {
              return (
                <div class="row">
                  <dt>{entry.label}</dt>
                  <dd>{entry.value}</dd>
                </div>
              );
            }}
          </For>
        </dl>
        <p class="note">
          Recorded in
          {' '}
          <code>linteljs.config.json</code>
          , which
          {' '}
          <code>sync</code>
          {' '}
          reads.
        </p>
      </section>
    </main>
  );
};
