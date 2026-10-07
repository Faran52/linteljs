import { submitContact } from '@services/contact-form/contactFormService';

import { useSubmitContact } from './contactApi';

describe('useSubmitContact', () => {
  it('sends through submitContact with no data layer', () => {
    const submit = useSubmitContact();

    expect(submit).toBe(submitContact);
  });
});
