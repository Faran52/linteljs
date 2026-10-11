'use client';

import { useTranslations } from 'next-intl';

import { ANSWERS, STACK } from '@config/linteljs';

import { CodeText } from '@ui/code-text/CodeText';

import type { ReactNode } from 'react';

import './page.css';

const code = (chunks: string): string => {
  return `<code>${chunks}</code>`;
};

// Recorded when the project was generated: a browser cannot read its machine's Node or package manager.
// A client component, so it speaks the reader's language.
const VersionPage = (): ReactNode => {
  const t = useTranslations();

  return (
    <main className="page">
      <h1 className="page-title">{t('version')}</h1>
      <p className="page-lede">{t('versionLede')}</p>

      <section className="section">
        <h2 className="section-title">{t('versionStack')}</h2>
        <dl className="rows">
          {STACK
            .map(({ name, version }) => {
              return (
                <div key={name} className="row">
                  <dt className="key">{name}</dt>
                  <dd className="value">{version}</dd>
                </div>
              );
            })}
        </dl>
      </section>

      <section className="section">
        <h2 className="section-title">{t('versionAnswers')}</h2>
        <dl className="rows">
          {ANSWERS
            .map(({ label, value }) => {
              return (
                <div key={label} className="row">
                  <dt className="key">{t(label)}</dt>
                  <dd className="value">{value}</dd>
                </div>
              );
            })}
        </dl>
        <p className="note">
          <CodeText
            text={t.markup('versionRecorded', {
              file: 'linteljs.config.json',
              command: 'sync',
              code,
            })}
            tone="primary"
          />
        </p>
      </section>
    </main>
  );
};

export default VersionPage;
