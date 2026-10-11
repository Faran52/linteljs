'use client';

import { useTranslations } from 'next-intl';

import { ANSWERS, STACK } from '@config/linteljs';

import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './page.styles';

import type { ReactNode } from 'react';

const code = (chunks: string): string => {
  return `<code>${chunks}</code>`;
};

// Recorded when the project was generated: a browser cannot read its machine's Node or package manager.
// A client component, so it speaks the reader's language.
const VersionPage = (): ReactNode => {
  const t = useTranslations();

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
                  <dt>{name}</dt>
                  <dd>{version}</dd>
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
                  <dt>{t(label)}</dt>
                  <dd>{value}</dd>
                </div>
              );
            })}
        </dl>
        <p {...styles.note}>
          <CodeText text={t.markup('versionRecorded', {
            file: 'linteljs.config.json',
            command: 'sync',
            code,
          })}
          />
        </p>
      </section>
    </main>
  );
};

export default VersionPage;
