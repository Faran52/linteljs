import { useTranslation } from 'react-i18next';

import { ANSWERS, STACK } from '@config/linteljs';

import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './VersionPage.styles';

import type { FC } from 'react';

const RECORDED_VALUES = {
  file: 'linteljs.config.json',
  command: 'sync',
};

// Recorded when the project was generated: a browser cannot read its machine's Node or package manager.
export const VersionPage: FC = () => {
  const { t } = useTranslation();

  return (
    <main {...styles.page}>
      <h1 {...styles.pageTitle}>{t('version')}</h1>
      <p {...styles.pageLede}>{t('versionLede')}</p>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('versionStack')}</h2>
        <dl {...styles.rows}>
          {STACK
            .map(({ name, version }) => {
              return (
                <div key={name} {...styles.row}>
                  <dt {...styles.key}>{name}</dt>
                  <dd {...styles.value}>{version}</dd>
                </div>
              );
            })}
        </dl>
      </section>

      <section {...styles.section}>
        <h2 {...styles.sectionTitle}>{t('versionAnswers')}</h2>
        <dl {...styles.rows}>
          {ANSWERS
            .map(({ label, value }) => {
              return (
                <div key={label} {...styles.row}>
                  <dt {...styles.key}>{t(label)}</dt>
                  <dd {...styles.value}>{value}</dd>
                </div>
              );
            })}
        </dl>
        <p {...styles.note}>
          <CodeText text={t('versionRecorded', RECORDED_VALUES)} tone="primary" />
        </p>
      </section>
    </main>
  );
};
