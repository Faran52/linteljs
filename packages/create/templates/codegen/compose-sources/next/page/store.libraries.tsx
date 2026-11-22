import { useCounter } from '@store/counter/counterStore';

import { Button } from '@ui';

import { styles } from './page.styles';

import type { CounterProps } from './ports';
import type { FC } from 'react';

export const pageComment = "A client component, because a store is state and state is the browser's.";

export const useCounterSetup = () => {
  const { count, add } = useCounter();

  return { count, add };
};

export const Counter: FC<CounterProps<ReturnType<typeof useCounterSetup>>> = ({ counter, t }) => {
  return (
    <>

      <div {...styles.counter}>
        <span {...styles.count} aria-live="polite">{counter.count}</span>
        <Button onClick={counter.add}>{t('homeAdd')}</Button>
      </div>
      <p {...styles.caption}>{t('homeCaption')}</p>

    </>
  );
};
