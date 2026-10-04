import { useSubmitContact } from './contactApi';
import { submitContact } from './submission';

describe('useSubmitContact', () => {
  it('sends through submitContact with no data layer', () => {
    const submit = useSubmitContact();

    expect(submit).toBe(submitContact);
  });
});
