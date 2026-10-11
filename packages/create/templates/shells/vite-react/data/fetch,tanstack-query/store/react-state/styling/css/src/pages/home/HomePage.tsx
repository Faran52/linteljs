import { useTranslation } from 'react-i18next';

import { CHECK } from '@config/linteljs';

import { Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import type { FC } from 'react';

import './HomePage.css';

export interface HomePageProps {
  readonly name: string;
}

const CHECK_VALUES = { command: CHECK };

export const HomePage: FC<HomePageProps> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{name}</h1>
      <p className="lede">{t('homeLedeReact')}</p>
      <p className="hint">
        <CodeText text={t('gateHint', CHECK_VALUES)} tone="primary" />
      </p>
    </main>
  );
};
