import { useTranslation } from 'react-i18next';

import {
  CHECK,
  GATE,
  SYNC,
} from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './AboutPage.styles';

import type { FC } from 'react';

const CHECK_VALUES = { command: CHECK };
const SYNC_VALUES = { command: SYNC };

export const AboutPage: FC = () => {
  const { t } = useTranslation();

  return (
    <main {...styles.page}>
      <h1 {...styles.pageTitle}>{t('about')}</h1>
      <p {...styles.pageLede}>{t('aboutLede')}</p>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('aboutGate')}</h2>
        <ul {...styles.rows}>
          {GATE
            .map(({ command, runs }) => {
              return (
                <li key={command} {...styles.row}>
                  <code {...styles.keyCode}>{command}</code>
                  <span {...styles.value}>{runs}</span>
                </li>
              );
            })}
        </ul>
        <p {...styles.note}>
          <CodeText text={t('aboutCheck', CHECK_VALUES)} />
        </p>
      </section>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('aboutStandard')}</h2>
        <dl {...styles.rows}>
          {STANDARD_PATHS
            .map(({ path, holds }) => {
              return (
                <div key={path} {...styles.row}>
                  <dt {...styles.key}><code>{path}</code></dt>
                  <dd {...styles.value}>{t(holds)}</dd>
                </div>
              );
            })}
        </dl>
      </section>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('aboutCurrent')}</h2>
        <p {...styles.note}>
          <CodeText text={t('aboutSync', SYNC_VALUES)} />
        </p>
      </section>
    </main>
  );
};
