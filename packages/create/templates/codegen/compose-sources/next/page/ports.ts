import type { useTranslations } from 'next-intl';

export interface CounterProps<TSetup> {
  readonly counter: TSetup;
  readonly t: ReturnType<typeof useTranslations>;
}
