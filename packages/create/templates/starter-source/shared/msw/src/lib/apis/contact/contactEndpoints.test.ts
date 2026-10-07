import { submitContact } from './contactEndpoints';

describe('submitContact', () => {
  it('posts details the rules accept and answers the reply', async () => {
    const submittedContact = await submitContact({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });
    const expected = { status: 200 };
    expect(submittedContact).toEqual(expected);
  });

  it('throws the refusal of details the rules refuse', async () => {
    const submittedContactPromise = submitContact({
      email: 'not-an-address',
      message: 'short',
    });
    await expect(submittedContactPromise).rejects.toThrow('The request failed with status 422.');
  });
});
