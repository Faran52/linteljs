import { useTranslation } from 'react-i18next';

import { CHECK, NAME } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import { Button, Mark } from '@ui';
import { CodeText } from '@ui/code-text/CodeText';

import type { FC } from 'react';

const CHECK_VALUES = { command: CHECK };

export const HomePage: FC = () => {
  const { t } = useTranslation();
  const { count, add } = useCounter();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{NAME}</h1>
      <p className="lede">{t('homeLedeReact')}</p>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div className="counter">
        <span className="count" aria-live="polite">{count}</span>
        <Button onClick={add}>{t('homeAdd')}</Button>
      </div>
      <p className="caption">{t('homeCaption')}</p>

      <p className="hint">
        <CodeText text={t('gateHint', CHECK_VALUES)} />
      </p>
    </main>
  );
};

export default HomePage;
