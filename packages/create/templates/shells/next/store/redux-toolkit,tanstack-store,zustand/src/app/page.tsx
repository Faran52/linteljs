'use client';

import { useTranslations } from 'next-intl';

import { CHECK, NAME } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import { Button, Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './page.styles';

import type { ReactNode } from 'react';

const code = (chunks: string): string => {
  return `<code>${chunks}</code>`;
};

// A client component, because a store is state and state is the browser's.
const HomePage = (): ReactNode => {
  const t = useTranslations();
  const { count, add } = useCounter();

  return (
    <main {...styles.hero}>
      <Mark />
      <h1 {...styles.title}>{NAME}</h1>
      <p {...styles.lede}>{t('homeLedeNext')}</p>

      <div {...styles.counter}>
        <span {...styles.count} aria-live="polite">{count}</span>
        <Button onClick={add}>{t('homeAdd')}</Button>
      </div>
      <p {...styles.caption}>{t('homeCaption')}</p>

      <p {...styles.hint}>
        <CodeText text={t.markup('gateHint', {
          command: CHECK,
          code,
        })}
        />
      </p>
    </main>
  );
};

export default HomePage;
