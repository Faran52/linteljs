import { Trans, useTranslation } from 'react-i18next';

import { CHECK } from '@config/linteljs';

import { useCounter } from '@store/counter/counterStore';

import { Button, Mark } from '@ui';

import type { FC } from 'react';

export interface HomePageProps {
  readonly name: string;
}

const CODE = { code: <code /> };
const CHECK_VALUES = { command: CHECK };

export const HomePage: FC<HomePageProps> = ({ name }) => {
  const { t } = useTranslation();
  const { count, add } = useCounter();

  return (
    <main className="hero">
      <Mark />
      <h1 className="title">{name}</h1>
      <p className="lede">{t('homeLedeReact')}</p>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div className="counter">
        <span className="count" aria-live="polite">{count}</span>
        <Button onClick={add}>{t('homeAdd')}</Button>
      </div>
      <p className="caption">{t('homeCaption')}</p>

      <p className="hint">
        <Trans
          i18nKey="gateHint"
          values={CHECK_VALUES}
          components={CODE}
        />
      </p>
    </main>
  );
};
