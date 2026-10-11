import { useTranslation } from 'react-i18next';

import { CHECK } from '@config/linteljs';

import { Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './HomePage.styles';

import type { FC } from 'react';

export interface HomePageProps {
  readonly name: string;
}

const CHECK_VALUES = { command: CHECK };

export const HomePage: FC<HomePageProps> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <main {...styles.hero}>
      <Mark />
      <h1 {...styles.title}>{name}</h1>
      <p {...styles.lede}>{t('homeLedeReact')}</p>
      <p {...styles.hint}>
        <CodeText text={t('gateHint', CHECK_VALUES)} />
      </p>
    </main>
  );
};
