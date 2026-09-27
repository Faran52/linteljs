import { submitContact } from './api';

describe('submitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    expect(await submitContact({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    })).toEqual({ status: 200 });
  });

  it('refuses details the rules refuse', async () => {
    await expect(submitContact({
      email: 'not-an-address',
      message: 'short',
    })).rejects.toThrow('Contact details are not valid');
  });
});
