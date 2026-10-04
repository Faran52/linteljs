import { ANSWERS, STACK } from '@config/linteljs';

import type { ReactNode } from 'react';

// Recorded when the project was generated: a browser cannot read its machine's Node or package manager.
const VersionPage = (): ReactNode => {
  return (
    <main className="page">
      <h1 className="page-title">Version</h1>
      <p className="page-lede">What this project is running, and the answers it was generated from.</p>

      <section className="section">
        <h2 className="section-title">Stack</h2>
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
        <h2 className="section-title">Your answers</h2>
        <dl className="rows">
          {ANSWERS
            .map(({ label, value }) => {
              return (
                <div key={label} className="row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              );
            })}
        </dl>
        <p className="note">
          Recorded in
          {' '}
          <code>linteljs.config.json</code>
          , which
          {' '}
          <code>sync</code>
          {' '}
          reads.
        </p>
      </section>
    </main>
  );
};

export default VersionPage;
