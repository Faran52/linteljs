import {
  CONTACT_TEXT,
  errorText,
  submitContact,
  validateContact,
  validateContactForm,
} from './contactFormService';

const VALID = {
  email: 'someone@example.com',
  message: 'Ten characters, at least.',
};

const INVALID = {
  email: 'not-an-address',
  message: 'short',
};

describe('validateContact', () => {
  it('answers no errors for details the rules accept', () => {
    const errors = validateContact(VALID);
    expect(errors).toEqual({});
  });

  it('names the rule each field breaks', () => {
    const errors = validateContact(INVALID);
    const expected = {
      email: 'contactEmailInvalid',
      message: 'contactMessageShort',
    };
    expect(errors).toEqual(expected);
  });
});

describe('errorText', () => {
  it('translates a rule key', () => {
    const text = errorText('contactEmailInvalid', (key) => {
      return CONTACT_TEXT[key];
    });
    expect(text).toBe(CONTACT_TEXT.contactEmailInvalid);
  });

  it('shows nothing for anything else', () => {
    const text = errorText('undefined', (key) => {
      return CONTACT_TEXT[key];
    });
    expect(text).toBeUndefined();
  });
});

describe('validateContactForm', () => {
  it('answers nothing for details the rules accept', () => {
    const errors = validateContactForm({ value: VALID });
    expect(errors).toBeUndefined();
  });

  it('names each field the rules refuse', () => {
    const errors = validateContactForm({ value: INVALID });
    const expected = {
      fields: {
        email: 'contactEmailInvalid',
        message: 'contactMessageShort',
      },
    };
    expect(errors).toEqual(expected);
  });
});

describe('submitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    const submittedContact = await submitContact(VALID);
    const expected = { status: 200 };
    expect(submittedContact).toEqual(expected);
  });

  it('refuses details the rules refuse', async () => {
    const submittedContactPromise = submitContact(INVALID);
    await expect(submittedContactPromise).rejects.toThrow('Contact details are not valid');
  });
});
