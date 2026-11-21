import { useTranslation } from 'react-i18next';

import { CHECK } from '@config/linteljs';

import { Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import { Counter, useCounterSetup } from './store';
import { sx } from './styling';

import type { FC } from 'react';

export interface HomePageProps {
  readonly name: string;
}

const CHECK_VALUES = { command: CHECK };

export const HomePage: FC<HomePageProps> = ({ name }) => {
  const { t } = useTranslation();
  const counter = useCounterSetup();

  return (
    <main {...sx.hero}>
      <Mark />
      <h1 {...sx.title}>{name}</h1>
      <p {...sx.lede}>{t('homeLedeReact')}</p>
      <Counter counter={counter} t={t} />
      <p {...sx.hint}>
        <CodeText text={t('gateHint', CHECK_VALUES)} tone="primary" />
      </p>
    </main>
  );
};
