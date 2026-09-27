import { type FC, useState } from 'react';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { DataProvider } from '../../providers/DataProvider';
import { StoreProvider } from '../../providers/StoreProvider';

import { useSubmitContact } from './api';

import type { ContactValues } from './schemas';

interface ProbeProps {
  readonly values: ContactValues;
}

const Probe: FC<ProbeProps> = ({ values }) => {
  const submit = useSubmitContact();
  const [outcome, setOutcome] = useState('waiting');
  const press = async (): Promise<void> => {
    try {
      const result = await submit(values);

      setOutcome(`sent ${String(result.status)}`);
    }
    catch {
      setOutcome('refused');
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        void press();
      }}
    >
      {outcome}
    </button>
  );
};

const press = (values: ContactValues): void => {
  render(
    <StoreProvider>
      <DataProvider>
        <Probe values={values} />
      </DataProvider>
    </StoreProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'waiting' }));
};

describe('useSubmitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    press({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });

    expect(await screen.findByRole('button', { name: 'sent 200' })).toBeTruthy();
  });

  it('refuses details the rules refuse', async () => {
    press({
      email: 'not-an-address',
      message: 'short',
    });

    expect(await screen.findByRole('button', { name: 'refused' })).toBeTruthy();
  });
});
