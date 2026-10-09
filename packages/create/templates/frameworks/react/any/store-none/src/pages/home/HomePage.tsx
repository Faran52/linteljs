import { useTranslation } from 'react-i18next';

import { CHECK, NAME } from '@config/linteljs';

import { Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import type { FC } from 'react';

const CHECK_VALUES = { command: CHECK };

export const HomePage: FC = () => {
  const { t } = useTranslation();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{NAME}</h1>
      <p className="lede">{t('homeLedeReact')}</p>
      <p className="hint">
        <CodeText text={t('gateHint', CHECK_VALUES)} />
      </p>
    </main>
  );
};

export default HomePage;
