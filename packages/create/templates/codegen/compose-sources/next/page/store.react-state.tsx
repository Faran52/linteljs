import type { CounterProps } from './ports';
import type { FC } from 'react';

export const pageComment = "A client component, so it speaks the reader's language.";

export const useCounterSetup = (): Record<never, never> => {
  return {};
};

export const Counter: FC<CounterProps<Record<never, never>>> = () => {
  return <></>;
};
