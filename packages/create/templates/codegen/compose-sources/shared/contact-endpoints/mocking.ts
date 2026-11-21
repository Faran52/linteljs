import type { submitContact as SubmitContact } from './contactEndpoints';

export const mocking = {
  accepts: '',
  refuses: '',
  refusal: '',
};

export const mockingCases = (submitContact: typeof SubmitContact): void => {};
