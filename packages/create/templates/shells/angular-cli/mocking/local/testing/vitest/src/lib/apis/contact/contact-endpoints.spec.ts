import { submitContact } from './contactEndpoints';

describe('submitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    const submittedContact = await submitContact({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });
    const expected = { status: 200 };
    expect(submittedContact).toEqual(expected);
  });

  it('refuses details the rules refuse', async () => {
    const submittedContactPromise = submitContact({
      email: 'not-an-address',
      message: 'short',
    });
    await expect(submittedContactPromise).rejects.toThrow('Contact details are not valid');
  });
});
