'use client';

import { useTranslations } from 'next-intl';

import { CHECK, NAME } from '@config/linteljs';

import { Mark } from '@ui';

import type { ReactNode } from 'react';

const code = (chunks: ReactNode): ReactNode => {
  return <code>{chunks}</code>;
};

// A client component, so it speaks the reader's language.
const HomePage = (): ReactNode => {
  const t = useTranslations();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{NAME}</h1>
      <p className="lede">{t('homeLedeNext')}</p>
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
