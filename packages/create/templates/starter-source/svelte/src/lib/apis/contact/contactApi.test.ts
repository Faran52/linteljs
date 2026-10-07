import { submitContact } from '@services/contact-submit/contactSubmitService';

import { useSubmitContact } from './contactApi';

describe('useSubmitContact', () => {
  it('sends through submitContact with no data layer', () => {
    const submit = useSubmitContact();

    expect(submit).toBe(submitContact);
  });
});
