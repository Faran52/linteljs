import { submitContact } from './contactEndpoints';
import { mocking, mockingCases } from './mocking';

describe('submitContact', () => {
  it(mocking.accepts, async () => {
    const submittedContact = await submitContact({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });
    const expected = { status: 200 };
    expect(submittedContact).toEqual(expected);
  });

  it(mocking.refuses, async () => {
    const submittedContactPromise = submitContact({
      email: 'not-an-address',
      message: 'short',
    });
    await expect(submittedContactPromise).rejects.toThrow(mocking.refusal);
  });

  mockingCases(submitContact);
});
