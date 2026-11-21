import type { CounterProps } from './ports';
import type { FC } from 'react';

export const useCounterSetup = (): Record<never, never> => {
  return {};
};

export const Counter: FC<CounterProps<Record<never, never>>> = () => {
  return <></>;
};
