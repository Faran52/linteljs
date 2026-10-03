'use client';

import { useTranslations } from 'next-intl';

import { CHECK, NAME } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import { Button, Mark } from '@ui';

import type { ReactNode } from 'react';

const code = (chunks: ReactNode): ReactNode => {
  return <code>{chunks}</code>;
};

// A client component, because a store is state and state is the browser's.
const HomePage = (): ReactNode => {
  const t = useTranslations();
  const { count, add } = useCounter();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{NAME}</h1>
      <p className="lede">{t('homeLedeNext')}</p>

      <div className="counter">
        <span className="count" aria-live="polite">{count}</span>
        <Button onClick={add}>{t('homeAdd')}</Button>
      </div>
      <p className="caption">{t('homeCaption')}</p>

      <p className="hint">
        {t.rich('gateHint', {
          command: CHECK,
          code,
        })}
      </p>
    </main>
  );
};

export default HomePage;
