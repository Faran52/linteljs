import { submitContact } from './api';

/*
 * The rules on the far side of the form: a caller that goes round the binding is still refused. `useSubmitContact`
 * is covered by the page that calls it, since with TanStack Query it is a mutation and needs a client above it.
 */
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
