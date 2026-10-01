import { For, type JSX } from 'solid-js';

import { t } from '@i18n';

import { ANSWERS, STACK } from '@config/linteljs';

import { CodeText } from '@ui/code-text/CodeText';

// Recorded at birth: a browser cannot read its machine's Node or package manager.
export const VersionPage = (): JSX.Element => {
  return (
    <main class="page">
      <h1 class="page-title">{t('version')}</h1>
      <p class="page-lede">{t('versionLede')}</p>

      <section class="section">
        <h2 class="section-title">{t('versionStack')}</h2>
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
        <h2 class="section-title">{t('versionAnswers')}</h2>
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
          <CodeText
            text={t('versionRecorded', {
              file: 'linteljs.config.json',
              command: 'sync',
            })}
          />
        </p>
      </section>
    </main>
  );
};
