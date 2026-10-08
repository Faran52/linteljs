import { Trans, useTranslation } from 'react-i18next';

import { ANSWERS, STACK } from '@config/linteljs';

import type { FC } from 'react';

const CODE = { code: <code /> };
const RECORDED_VALUES = {
  file: 'linteljs.config.json',
  command: 'sync',
};

// Recorded when the project was generated: a browser cannot read its machine's Node or package manager.
export const VersionPage: FC = () => {
  const { t } = useTranslation();

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
                  <dt>{name}</dt>
                  <dd>{version}</dd>
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
                  <dt>{t(label)}</dt>
                  <dd>{value}</dd>
                </div>
              );
            })}
        </dl>
        <p className="note">
          <Trans
            i18nKey="versionRecorded"
            values={RECORDED_VALUES}
            components={CODE}
            t={t}
          />
        </p>
      </section>
    </main>
  );
};
