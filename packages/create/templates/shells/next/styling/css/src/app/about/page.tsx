'use client';

import { useTranslations } from 'next-intl';

import {
  CHECK,
  GATE,
  SYNC,
} from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { CodeText } from '@ui/code-text/CodeText';

import type { ReactNode } from 'react';

import './page.css';

const code = (chunks: string): string => {
  return `<code>${chunks}</code>`;
};

// A client component, so it speaks the reader's language.
const AboutPage = (): ReactNode => {
  const t = useTranslations();

  return (
    <main className="page">
      <h1 className="page-title">{t('about')}</h1>
      <p className="page-lede">{t('aboutLede')}</p>

      <section className="section">
        <h2 className="section-title">{t('aboutGate')}</h2>
        <ul className="rows">
          {GATE
            .map(({ command, runs }) => {
              return (
                <li key={command} className="row">
                  <code className="key-code">{command}</code>
                  <span className="value">{runs}</span>
                </li>
              );
            })}
        </ul>
        <p className="note">
          <CodeText
            text={t.markup('aboutCheck', {
              command: CHECK,
              code,
            })}
            tone="primary"
          />
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">{t('aboutStandard')}</h2>
        <dl className="rows">
          {STANDARD_PATHS
            .map(({ path, holds }) => {
              return (
                <div key={path} className="row">
                  <dt className="key"><code>{path}</code></dt>
                  <dd className="value">{t(holds)}</dd>
                </div>
              );
            })}
        </dl>
      </section>

      <section className="section">
        <h2 className="section-title">{t('aboutCurrent')}</h2>
        <p className="note">
          <CodeText
            text={t.markup('aboutSync', {
              command: SYNC,
              code,
            })}
            tone="primary"
          />
        </p>
      </section>
    </main>
  );
};

export default AboutPage;
