import { useSubmitContact } from './contact-api';

describe('useSubmitContact', () => {
  it('answers 200 for values the rules accept', async () => {
    const submit = useSubmitContact();

    const result = await submit({
      email: 'someone@example.com',
      message: 'Ten characters, at least.',
    });

    expect(result.status).toBe(200);
  });

  it('refuses values the rules refuse', async () => {
    const submit = useSubmitContact();

    const sending = submit({
      email: 'not-an-address',
      message: '',
    });

    await expect(sending).rejects.toThrow('Contact details are not valid');
  });
});
