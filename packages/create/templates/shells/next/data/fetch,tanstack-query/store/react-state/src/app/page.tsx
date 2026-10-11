'use client';

import { useTranslations } from 'next-intl';

import { CHECK, NAME } from '@config/linteljs';

import { Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './page.styles';

import type { ReactNode } from 'react';

const code = (chunks: string): string => {
  return `<code>${chunks}</code>`;
};

// A client component, so it speaks the reader's language.
const HomePage = (): ReactNode => {
  const t = useTranslations();

  return (
    <main {...styles.hero}>
      <Mark />
      <h1 {...styles.title}>{NAME}</h1>
      <p {...styles.lede}>{t('homeLedeNext')}</p>
      <p {...styles.hint}>
        <CodeText
          text={t.markup('gateHint', {
            command: CHECK,
            code,
          })}
          tone="primary"
        />
      </p>
    </main>
  );
};

export default HomePage;
