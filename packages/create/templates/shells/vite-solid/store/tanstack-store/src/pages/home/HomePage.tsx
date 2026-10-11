import { CHECK } from '@config/linteljs';

import { createCounter } from '@store/counter/counterStore';
import { t } from '@i18n/i18n';

import { Button, Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import { styles } from './HomePage.styles';

import type { JSX } from 'solid-js';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage = (props: HomePageProps): JSX.Element => {
  const counter = createCounter();

  return (
    <main {...styles.hero}>
      <Mark />
      <h1 {...styles.title}>{props.name}</h1>
      <p {...styles.lede}>{t('homeLedeSolid')}</p>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div {...styles.counter}>
        <span {...styles.count} aria-live="polite">{counter.count()}</span>
        <Button onClick={counter.add}>{t('homeAdd')}</Button>
      </div>
      <p {...styles.caption}>{t('homeCaption')}</p>

      <p {...styles.hint}>
        <CodeText text={t('gateHint', { command: CHECK })} />
      </p>
    </main>
  );
};
