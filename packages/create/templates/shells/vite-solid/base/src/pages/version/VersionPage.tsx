import { For, type JSX } from 'solid-js';

import { ANSWERS, STACK } from '@config/linteljs';

import { t } from '@i18n/i18n';

import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './VersionPage.styles';

// Recorded when the project was generated: a browser cannot read its machine's Node or package manager.
export const VersionPage = (): JSX.Element => {
  return (
    <main {...styles.page}>
      <h1 {...styles.pageTitle}>{t('version')}</h1>
      <p {...styles.pageLede}>{t('versionLede')}</p>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('versionStack')}</h2>
        <dl {...styles.rows}>
          <For each={STACK}>
            {(entry) => {
              return (
                <div {...styles.row}>
                  <dt {...styles.key}>{entry.name}</dt>
                  <dd {...styles.value}>{entry.version}</dd>
                </div>
              );
            }}
          </For>
        </dl>
      </section>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('versionAnswers')}</h2>
        <dl {...styles.rows}>
          <For each={ANSWERS}>
            {(entry) => {
              return (
                <div {...styles.row}>
                  <dt {...styles.key}>{t(entry.label)}</dt>
                  <dd {...styles.value}>{entry.value}</dd>
                </div>
              );
            }}
          </For>
        </dl>
        <p {...styles.note}>
          <CodeText
            text={t('versionRecorded', {
              file: 'linteljs.config.json',
              command: 'sync',
            })}
            tone="primary"
          />
        </p>
      </section>
    </main>
  );
};
