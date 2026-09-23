import { ANSWERS, STACK } from '../../config/linteljs';

import type { ReactNode } from 'react';

/*
 * What was recorded at birth, rather than what is resolved now. A browser cannot read its machine's Node or
 * package manager, and `package.json` carries ranges rather than versions, so a runtime read would restate a
 * literal at the cost of a tsconfig flag.
 *
 * This project owns `lib/linteljs.ts` from its first run, the way it owns the rest of its source, so `sync` never
 * rewrites it. Edit it, or delete this page with the rest of the starter.
 */
// A server component: what it renders was recorded at birth and never changes at runtime.
const VersionPage = (): ReactNode => {
  return (
    <main className="page">
      <h1 className="page-title">Version</h1>
      <p className="page-lede">What this project is running, and the answers it was generated from.</p>

      <section className="section">
        <h2 className="section-title">Stack</h2>
        <dl className="rows">
          {STACK.map(({ name, version }) => {
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
          {ANSWERS.map(({ label, value }) => {
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
