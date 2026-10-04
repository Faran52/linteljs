import { renderHook } from '@solidjs/testing-library';

import { DataProvider } from '@lib/providers/data/DataProvider';

import { createSubmitContact } from './contactApi';

import type { ContactValues } from './schemas';

const outcomeOf = async (values: ContactValues): Promise<string> => {
  const { result } = renderHook(createSubmitContact, { wrapper: DataProvider });

  try {
    const { status } = await result(values);

    return `sent ${String(status)}`;
  }
  catch {
    return 'refused';
  }
};

describe('createSubmitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    const outcome = await outcomeOf({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });

    expect(outcome).toBe('sent 200');
  });

  it('refuses details the rules refuse', async () => {
    const outcome = await outcomeOf({
      email: 'not-an-address',
      message: 'short',
    });

    expect(outcome).toBe('refused');
  });
});
