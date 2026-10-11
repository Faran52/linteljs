import { CHECK } from '@config/linteljs';

import { t } from '@i18n/i18n';

import { Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import type { JSX } from 'solid-js';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage = (props: HomePageProps): JSX.Element => {
  return (
    <main class="hero">
      <Mark />
      <h1 class="title">{props.name}</h1>
      <p class="lede">{t('homeLedeSolid')}</p>
      <p class="hint">
        <CodeText text={t('gateHint', { command: CHECK })} />
      </p>
    </main>
  );
};
