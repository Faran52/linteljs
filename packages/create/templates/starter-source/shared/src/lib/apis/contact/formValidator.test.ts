import { validateContactForm } from './formValidator';

describe('validateContactForm', () => {
  it('answers nothing for details the rules accept', () => {
    const errors = validateContactForm({
      value: {
        email: 'someone@example.com',
        message: 'Ten characters, at least.',
      },
    });
    expect(errors).toBeUndefined();
  });

  it('names each field the rules refuse', () => {
    const errors = validateContactForm({
      value: {
        email: 'not-an-address',
        message: 'short',
      },
    });
    const expected = {
      fields: {
        email: 'contactEmailInvalid',
        message: 'contactMessageShort',
      },
    };
    expect(errors).toEqual(expected);
  });
});
