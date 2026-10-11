import { For, type JSX } from 'solid-js';

import {
  CHECK,
  GATE,
  SYNC,
} from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { t } from '@i18n/i18n';

import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './AboutPage.styles';

export const AboutPage = (): JSX.Element => {
  return (
    <main {...styles.page}>
      <h1 {...styles.pageTitle}>{t('about')}</h1>
      <p {...styles.pageLede}>{t('aboutLede')}</p>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('aboutGate')}</h2>
        <ul {...styles.rows}>
          <For each={GATE}>
            {(leg) => {
              return (
                <li {...styles.row}>
                  <code {...styles.keyCode}>{leg.command}</code>
                  <span {...styles.value}>{leg.runs}</span>
                </li>
              );
            }}
          </For>
        </ul>
        <p {...styles.note}>
          <CodeText text={t('aboutCheck', { command: CHECK })} tone="primary" />
        </p>
      </section>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('aboutStandard')}</h2>
        <dl {...styles.rows}>
          <For each={STANDARD_PATHS}>
            {(entry) => {
              return (
                <div {...styles.row}>
                  <dt {...styles.key}><code>{entry.path}</code></dt>
                  <dd {...styles.value}>{t(entry.holds)}</dd>
                </div>
              );
            }}
          </For>
        </dl>
      </section>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('aboutCurrent')}</h2>
        <p {...styles.note}>
          <CodeText text={t('aboutSync', { command: SYNC })} tone="primary" />
        </p>
      </section>
    </main>
  );
};
