import { fireEvent, screen } from '@solidjs/testing-library';

import { createCounter } from '@store/counter/counterStore';
import { t } from '@i18n/i18n';

import { Button } from '@ui';

import { styles } from './HomePage.styles';

import type { CounterProps } from './ports';
import type { Component } from 'solid-js';

export const storeCases = (open: () => void): void => {
  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element = screen.getByText('1');
    expect(element).toBeTruthy();
  });
};

export const createCounterSetup = () => {
  const counter = createCounter();

  return { counter };
};

export const Counter: Component<CounterProps<ReturnType<typeof createCounterSetup>>> = ({ setup }) => {
  return (
    <>

      {/* State that outlives the page: switch tabs and come back, and the count is still here. */}
      <div {...styles.counter}>
        <span {...styles.count} aria-live="polite">{setup.counter.count()}</span>
        <Button onClick={setup.counter.add}>{t('homeAdd')}</Button>
      </div>
      <p {...styles.caption}>{t('homeCaption')}</p>

    </>
  );
};
