import { createSignal } from 'solid-js';
import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { DataProvider } from '../../providers/DataProvider';

import { useSubmitContact } from './api';

import type { JSX } from 'solid-js';
import type { ContactValues } from './schemas';

interface ProbeProps {
  readonly values: ContactValues;
}

/*
 * Through the hook and the data slot, so the one suite covers both spellings of this module: a plain async
 * function and a TanStack Query mutation answer the same `useSubmitContact`.
 */
const Probe = (props: ProbeProps): JSX.Element => {
  const submit = useSubmitContact();
  const [outcome, setOutcome] = createSignal('waiting');
  const press = async (): Promise<void> => {
    try {
      const result = await submit(props.values);

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
      {outcome()}
    </button>
  );
};

const press = (values: ContactValues): void => {
  render(() => {
    return (
      <DataProvider>
        <Probe values={values} />
      </DataProvider>
    );
  });
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

  // The rules again, on the far side of the form: a caller that goes round the binding is still refused.
  it('refuses details the rules refuse', async () => {
    press({
      email: 'not-an-address',
      message: 'short',
    });

    expect(await screen.findByRole('button', { name: 'refused' })).toBeTruthy();
  });
});
