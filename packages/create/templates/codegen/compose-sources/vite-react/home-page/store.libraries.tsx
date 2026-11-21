import { useCounter } from '@store/counter/counterStore';

import { Button } from '@ui';

import { sx } from './styling';

import type { CounterProps } from './ports';
import type { FC } from 'react';

export const useCounterSetup = () => {
  const { count, add } = useCounter();

  return { count, add };
};

export const Counter: FC<CounterProps<ReturnType<typeof useCounterSetup>>> = ({ counter, t }) => {
  return (
    <>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div {...sx.counter}>
        <span {...sx.count} aria-live="polite">{counter.count}</span>
        <Button onClick={counter.add}>{t('homeAdd')}</Button>
      </div>
      <p {...sx.caption}>{t('homeCaption')}</p>

    </>
  );
};
