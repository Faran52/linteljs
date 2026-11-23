import { act, renderHook } from '@testing-library/react';

import { WithProviders } from '@mocks/WithProviders';

import { useSubmitContact } from './contactApi';

import type { ContactValues } from '@services/contact-form/contactFormService';

const outcomeOf = async (values: ContactValues): Promise<string> => {
  const { result } = renderHook(useSubmitContact, { wrapper: WithProviders });

  return await act(async () => {
    try {
      const { status } = await result.current(values);

      return `sent ${String(status)}`;
    }
    catch {
      return 'refused';
    }
  });
};

describe('useSubmitContact', () => {
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
