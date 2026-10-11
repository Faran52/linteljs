import { CHECK } from '@config/linteljs';

import { t } from '@i18n/i18n';

import { Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './HomePage.styles';

import type { JSX } from 'solid-js';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage = (props: HomePageProps): JSX.Element => {
  return (
    <main {...styles.hero}>
      <Mark />
      <h1 {...styles.title}>{props.name}</h1>
      <p {...styles.lede}>{t('homeLedeSolid')}</p>
      <p {...styles.hint}>
        <CodeText text={t('gateHint', { command: CHECK })} />
      </p>
    </main>
  );
};
