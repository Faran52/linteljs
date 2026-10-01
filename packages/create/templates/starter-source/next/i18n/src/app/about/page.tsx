'use client';

import { useTranslations } from 'next-intl';

import { CHECK, GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import type { ReactNode } from 'react';

const code = (chunks: ReactNode): ReactNode => {
  return <code>{chunks}</code>;
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
                  <code className="key">{command}</code>
                  <span className="value">{runs}</span>
                </li>
              );
            })}
        </ul>
        <p className="note">
          {t.rich('aboutCheck', {
            command: CHECK,
            code,
          })}
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">{t('aboutStandard')}</h2>
        <dl className="rows">
          {STANDARD_PATHS
            .map(({ path, holds }) => {
              return (
                <div key={path} className="row">
                  <dt><code>{path}</code></dt>
                  <dd>{t(holds)}</dd>
                </div>
              );
            })}
        </dl>
      </section>

      <section className="section">
        <h2 className="section-title">{t('aboutCurrent')}</h2>
        <p className="note">
          {t.rich('aboutSync', {
            command: 'npx @linteljs/create sync',
            code,
          })}
        </p>
      </section>
    </main>
  );
};

export default AboutPage;
