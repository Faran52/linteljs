import { CHECK } from '@config/linteljs';

import { createCounter } from '@store/counter/counterStore';
import { t } from '@i18n';

import { Button, Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import type { JSX } from 'solid-js';

export interface HomePageProps {
  readonly name: string;
}

export const HomePage = (props: HomePageProps): JSX.Element => {
  const counter = createCounter();

  return (
    <main class="hero">
      <Mark />
      <h1 class="title">{props.name}</h1>
      <p class="lede">{t('homeLedeSolid')}</p>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div class="counter">
        <span class="count" aria-live="polite">{counter.count()}</span>
        <Button onClick={counter.add}>{t('homeAdd')}</Button>
      </div>
      <p class="caption">{t('homeCaption')}</p>

      <p class="hint">
        <CodeText text={t('gateHint', { command: CHECK })} />
      </p>
    </main>
  );
};
