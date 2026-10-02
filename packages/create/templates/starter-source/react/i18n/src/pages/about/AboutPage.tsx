import { Trans, useTranslation } from 'react-i18next';

import { CHECK, GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import type { FC } from 'react';

const CODE = { code: <code /> };
const CHECK_VALUES = { command: CHECK };
const SYNC_VALUES = { command: 'npx @linteljs/create sync' };

export const AboutPage: FC = () => {
  const { t } = useTranslation();

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
          <Trans
            i18nKey="aboutCheck"
            values={CHECK_VALUES}
            components={CODE}
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
          <Trans
            i18nKey="aboutSync"
            values={SYNC_VALUES}
            components={CODE}
          />
        </p>
      </section>
    </main>
  );
};
