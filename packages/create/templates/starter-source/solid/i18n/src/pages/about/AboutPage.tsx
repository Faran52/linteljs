import { For, type JSX } from 'solid-js';

import { t } from '@i18n';

import { CHECK, GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { CodeText } from '@ui/code-text/CodeText';

export const AboutPage = (): JSX.Element => {
  return (
    <main class="page">
      <h1 class="page-title">{t('about')}</h1>
      <p class="page-lede">{t('aboutLede')}</p>

      <section class="section">
        <h2 class="section-title">{t('aboutGate')}</h2>
        <ul class="rows">
          <For each={GATE}>
            {(leg) => {
              return (
                <li class="row">
                  <code class="key">{leg.command}</code>
                  <span class="value">{leg.runs}</span>
                </li>
              );
            }}
          </For>
        </ul>
        <p class="note">
          <CodeText text={t('aboutCheck', { command: CHECK })} />
        </p>
      </section>

      <section class="section">
        <h2 class="section-title">{t('aboutStandard')}</h2>
        <dl class="rows">
          <For each={STANDARD_PATHS}>
            {(entry) => {
              return (
                <div class="row">
                  <dt><code>{entry.path}</code></dt>
                  <dd>{t(entry.holds)}</dd>
                </div>
              );
            }}
          </For>
        </dl>
      </section>

      <section class="section">
        <h2 class="section-title">{t('aboutCurrent')}</h2>
        <p class="note">
          <CodeText text={t('aboutSync', { command: 'npx @linteljs/create sync' })} />
        </p>
      </section>
    </main>
  );
};
